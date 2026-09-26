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


def _og(request):
    scheme = request.scheme if settings.DEBUG else 'https'
    base = f'{scheme}://{request.get_host()}'
    return {
        'og_image': base + static('wish/og.png'),
        'og_url': base + request.path,
        'view_url': base + reverse('wish:view'),
    }


def view_wish(request):
    return render(request, 'wish/view.html', _og(request))


def create_wish(request):
    return render(request, 'wish/create.html', _og(request))


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
    wid = str(data.get('i', ''))[:12].lower()
    ref = str(data.get('r', ''))[:12].lower()
    if event not in _EVENTS or not _ID.match(wid) or not _ID.match(ref):
        return HttpResponseBadRequest()
    WishEvent.objects.create(event=event, wid=wid, ref=ref)
    return HttpResponse(status=204)


@staff_member_required
def stats(request):
    rows = (WishEvent.objects.values('event')
            .annotate(total=Count('id'), wishes=Count('wid', distinct=True)))
    by_event = {r['event']: r for r in rows}
    table = [(label, by_event.get(key, {}).get('total', 0), by_event.get(key, {}).get('wishes', 0))
             for key, label in WishEvent.EVENTS]

    opened = set(WishEvent.objects.filter(event='start').exclude(wid='')
                 .values_list('wid', flat=True))
    sent_back = set(WishEvent.objects.filter(event='link_created').exclude(ref='')
                    .values_list('ref', flat=True))
    reciprocity = (len(opened & sent_back) / len(opened) * 100) if opened else 0
    return render(request, 'wish/stats.html', {
        'table': table,
        'opened': len(opened),
        'sent_back': len(opened & sent_back),
        'reciprocity': round(reciprocity, 1),
    })
