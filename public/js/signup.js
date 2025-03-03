document.querySelectorAll('.toggle-password').forEach(function (button) {
    button.addEventListener('click', function () {
        const input = this.parentElement.querySelector('input');
        if (input.type === "password") {
            input.type = "text";
            this.innerHTML = '<i class="bx bx-hide"></i>';
        } else {
            input.type = "password";
            this.innerHTML = '<i class="bx bx-show"></i>';
        }
    });
});