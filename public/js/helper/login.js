$(document).ready(function(){
    $.ajax({
        type: "get",
        url: "/api/login-detail",
        success: function (data, status) {
            window.location = "index.html";
        }
    });
    $("#login").unbind().on("click",(event) =>{
        event.preventDefault();
        var valid = true;
        if(!$("#username").val()) {
            $("#username").addClass("is-invalid");
            valid = false;
        }
        if(!$("#password").val()) {
            $("#password").addClass("is-invalid");
            valid = false;
        }

        if (valid) {
            var username = $("#username").val();
            var password = $("#password").val();
            var formData = {
                'username'  : $("#username").val(),
                'password'  : $("#password").val()
            };
            $.ajax({
                type: "post",
                url: "/api/login",
                data: "username="+username+"&password="+password,
                success: function (data, status) {
                    window.location = "index.html"
                },
                statusCode : {
                    401: () => {
                        alert("The username or password you entered is incorrect");
                    }
                }
            });
        }
    });

    $("#username").unbind().on("input", ()=> {
        $("#username").removeClass("is-invalid")
    });
    $("#password").unbind().on("input", ()=> {
        $("#password").removeClass("is-invalid")
    });
});
