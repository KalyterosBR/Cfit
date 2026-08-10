from django.shortcuts import render


def plans_list(request):
    return render(
        request,
        "plans/list.html",
    )
