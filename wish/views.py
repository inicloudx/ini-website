import datetime
import json
import re

from django.conf import settings
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import WishEvent

_ID = re.compile(r'^[a-z0-9]{0,12}$')
_EVENTS = {e for e, _ in WishEvent.EVENTS}
_KINDS = {k for k, _ in WishEvent.KINDS} | {''}

# WhatsApp link-preview text per gift kind (the preview never contains names).
_OG = {
    'bday': {
        'title': '🎁 A birthday surprise is waiting for you!',
        'desc': 'Tap to open your 3D birthday cake 🎂 Light it, blow the candles!',
        'image': 'wish/og.png',
        'page_title': 'A birthday surprise for you 🎁',
    },
    'ty': {
        'title': '💖 Someone sent you a special thank-you!',
        'desc': 'Tap to open your 3D thank-you gift 🎁',
        'image': 'wish/og_thanks.png',
        'page_title': 'A thank-you gift for you 💖',
    },
    'rx': {
        'title': '💞 You’ve got a special reaction!',
        'desc': 'Tap to see it pop up in 3D, right in your room ✨',
        'image': 'wish/og_react.png',
        'page_title': 'A reaction for you 💞',
    },
    'aw': {
        'title': '🏆 And the award goes to… YOU! 😂',
        'desc': 'Your friends have an award for you. Tap to see the trophy 🥁',
        'image': 'wish/og_award.png',
        'page_title': 'An award for you 🏆',
    },
}


def _ctx(request, kind='bday'):
    scheme = request.scheme if settings.DEBUG else 'https'
    base = f'{scheme}://{request.get_host()}'
    og = _OG[kind]
    return {
        'kind': kind,
        'og_title': og['title'],
        'og_desc': og['desc'],
        'page_title': og['page_title'],
        'og_image': base + static(og['image']),
        'og_url': base + request.path,
        'view_url': base + reverse('wish:view'),
        'thanks_url': base + reverse('wish:thanks'),
        'react_url': base + reverse('wish:react'),
        'award_url': base + reverse('wish:award'),
    }


def view_wish(request):
    return render(request, 'wish/view.html', _ctx(request, 'bday'))


def view_thanks(request):
    return render(request, 'wish/view.html', _ctx(request, 'ty'))


def view_react(request):
    return render(request, 'wish/view.html', _ctx(request, 'rx'))


def view_award(request):
    return render(request, 'wish/view.html', _ctx(request, 'aw'))


def create_wish(request):
    return render(request, 'wish/create.html', _ctx(request, 'bday'))


@csrf_exempt
@require_POST
def track(request):
    if len(request.body) > 512:
        return HttpResponseBadRequest()
    try:
        data = json.loads(request.body)
    except ValueError:
        return HttpResponseBadRequest()
    event = str(data.get('e', ''))
    kind = str(data.get('k', ''))
    wid = str(data.get('i', ''))[:12].lower()
    ref = str(data.get('r', ''))[:12].lower()
    if event not in _EVENTS or kind not in _KINDS or not _ID.match(wid) or not _ID.match(ref):
        return HttpResponseBadRequest()
    WishEvent.objects.create(event=event, kind=kind, wid=wid, ref=ref)
    return HttpResponse(status=204)


# Friendlier names for the stats page (model labels kept as-is to avoid a migration).
_LABELS = {
    'gift_open': 'Opened the gift',
    'send_back': 'Tapped "send something back"',
    'start': 'Tapped open',
    'react': 'Sent a quick reaction',
}
_PERIODS = [('today', 'Today'), ('7d', 'Last 7 days'), ('30d', 'Last 30 days'), ('all', 'All time')]


@staff_member_required
def stats(request):
    today = timezone.localdate()
    period = request.GET.get('p', '7d')
    since = None
    since_param = request.GET.get('since', '')
    if since_param:
        try:
            since = datetime.date.fromisoformat(since_param)
            period = 'since'
        except ValueError:
            since = None
    if since is None:
        since = {'today': today, '7d': today - datetime.timedelta(days=6),
                 '30d': today - datetime.timedelta(days=29)}.get(period)
        if period not in dict(_PERIODS):
            period, since = '7d', today - datetime.timedelta(days=6)

    events = WishEvent.objects.all()
    if since:
        events = events.filter(created_at__date__gte=since)

    # Funnel table per gift type
    counts = {}
    for r in events.values('event', 'kind').annotate(total=Count('id')):
        counts.setdefault(r['event'], {})[r['kind'] or 'bday'] = r['total']
    table = [(_LABELS.get(key, label),) + tuple(counts.get(key, {}).get(k, 0) for k in ('bday', 'ty', 'rx', 'aw'))
             for key, label in WishEvent.EVENTS]

    # Headline numbers
    opened = set(events.filter(event='start').exclude(wid='').values_list('wid', flat=True))
    replied = set(WishEvent.objects.filter(event='link_created').exclude(ref='').values_list('ref', flat=True))
    reply_rate = (len(opened & replied) / len(opened) * 100) if opened else 0
    created = events.filter(event='link_created').count()

    # Day by day (newest first)
    def per_day(qs):
        return {r['d']: r['n'] for r in qs.annotate(d=TruncDate('created_at')).values('d').annotate(n=Count('id'))}
    first = since or (events.order_by('created_at').values_list('created_at', flat=True).first() or timezone.now()).date()
    first = max(first, today - datetime.timedelta(days=59))
    opens_d = per_day(events.filter(event='start'))
    made_d = per_day(events.filter(event='link_created'))
    replies_d = per_day(events.filter(event='link_created').exclude(ref=''))
    shares_d = per_day(events.filter(event__in=['wa_share', 'copy']))
    media_d = per_day(events.filter(event__in=['photo_share', 'video_share']))
    days = []
    d = today
    while d >= first:
        days.append({'date': d, 'opened': opens_d.get(d, 0), 'created': made_d.get(d, 0),
                     'replies': replies_d.get(d, 0), 'shared': shares_d.get(d, 0), 'media': media_d.get(d, 0)})
        d -= datetime.timedelta(days=1)
    peak = max([x['opened'] for x in days] + [x['created'] for x in days] + [1])
    for x in days:
        x['opened_pct'] = round(x['opened'] / peak * 100)
        x['created_pct'] = round(x['created'] / peak * 100)

    return render(request, 'wish/stats.html', {
        'table': table,
        'opened': len(opened),
        'sent_back': len(opened & replied),
        'reciprocity': round(reply_rate, 1),
        'created': created,
        'days': days,
        'periods': _PERIODS,
        'period': period,
        'since': since,
    })
