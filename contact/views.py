from django.shortcuts import render
from django.core.mail import send_mail
from django.conf import settings
from .models import ContactMessage


def contactpage(request):
    sent = False
    error = False

    if request.method == 'POST':
        name    = request.POST.get('name', '').strip()
        email   = request.POST.get('email', '').strip()
        subject = request.POST.get('subject', '').strip()
        message = request.POST.get('message', '').strip()

        if name and email and subject and message:
            msg = ContactMessage.objects.create(
                name=name, email=email, subject=subject, message=message
            )
            body = (
                f"New contact form submission from {name} <{email}>\n\n"
                f"Subject: {subject}\n\n"
                f"Message:\n{message}\n\n"
                f"---\nReply directly to: {email}"
            )
            try:
                send_mail(
                    subject=f"[iNiXR Contact] {subject}",
                    message=body,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[settings.CONTACT_EMAIL],
                    fail_silently=False,
                )
                msg.emailed = True
                msg.save()
                sent = True
            except Exception:
                sent = True  # message saved to DB; email may be unconfigured

    return render(request, 'contact/contact.html', {'sent': sent, 'error': error})
