import json
import re

from django.conf import settings
from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Count
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.templatetags.static import static
from django.urls import reverse
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
    }


def view_wish(request):
    return render(request, 'wish/view.html', _ctx(request, 'bday'))


def view_thanks(request):
    return render(request, 'wish/view.html', _ctx(request, 'ty'))


def view_react(request):
    return render(request, 'wish/view.html', _ctx(request, 'rx'))


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


@staff_member_required
def stats(request):
    rows = WishEvent.objects.values('event', 'kind').annotate(total=Count('id'))
    counts = {}
    for r in rows:
        counts.setdefault(r['event'], {})[r['kind'] or 'bday'] = r['total']
    table = [(label, counts.get(key, {}).get('bday', 0), counts.get(key, {}).get('ty', 0), counts.get(key, {}).get('rx', 0))
             for key, label in WishEvent.EVENTS]

    opened = set(WishEvent.objects.filter(event='start')
                 .exclude(wid='').values_list('wid', flat=True))
    replied = set(WishEvent.objects.filter(event='link_created').exclude(ref='')
                  .values_list('ref', flat=True))
    reply_rate = (len(opened & replied) / len(opened) * 100) if opened else 0
    return render(request, 'wish/stats.html', {
        'table': table,
        'opened': len(opened),
        'sent_back': len(opened & replied),
        'reciprocity': round(reply_rate, 1),
    })
