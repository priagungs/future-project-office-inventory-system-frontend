class Handover {
    constructor() {
        this.page = 0;
        this.sortBy = "idRequest";
        this.dropdownLimit = 5;
        this.isLastPage = false;
        this.requestLimit = 7;
    }

    init() {
        $.ajax({
            type: "get",
            url: "/api/login-detail",
            success: (data, status) => {
                this.idAdmin = data.idUser;
                this.fillRequestTable();
                // this.sendRequest(idAdmin);
            },
            statusCode: {
                401: () => {
                    window.location = "login.html";
                }
            }
        });

    }


    fillRequestTable() {
        $.ajax({
            method: "GET",
            url: "api/requests",
            dataType: "json",
            data: {page: this.page, limit: this.requestLimit, status: "APPROVED", sort: "idRequest"},
            success: (response) => {
                this.isLastPage = response.last;
                this.paginationHandler();
                var content = "";
                var idx = 1;
                response.content.forEach(element => {
                    content += '<tr id="data-ke-'+ idx +'" id-request="'+element.idRequest+'">'
                    + '<td class="text-center">' + element.idRequest + '</td>'
                    + '<td class="text-center">' + element.item.itemName + '</td>'
                    + '<td class="text-center">' + element.requestBy.name + '</td>'
                    + '<td class="text-center">' + element.reqQty + '</td>'
                    + '<td class="text-center">'
                    + '<label class="form-check-label">'
                    + '<input type="checkbox" class="form-check-input chk-box" name="opt'+idx+'" value="SENT" >'
                    + 'ready for send'
                    + '</label>'
                    + '</td>'
                    + '</tr>'
                    idx++;
                });
                if (idx > 1) {
                    for (var i = idx; i <= this.requestLimit; i++) {
                        content += '<tr style="height: 3rem"><td></td><td></td><td></td><td></td><td></td></tr>';
                    }
                    var contentButton = '';
                    contentButton = '<button id="sent-button" type="button" class="btn btn-primary" >SENT</button>';
                    $("#button-sent-area").html(contentButton);
                    this.sendRequest();
                } else {
                    content = '<tr>'
                            + '<td colspan=5> There is no request</td>'
                            + '</tr>';
                    $("#button-sent-area").html("");
                }
                idx--;
                $("#content-items").attr("counter",idx)
                $("#content-items").html(content);
            }
        });
    }

    paginationHandler() {
        var nextBtn = $("#page-handover-next");
        var prevBtn = $("#page-handover-prev");

        if (this.page == 0) {
            prevBtn.addClass("disabled");
        }
        else {
            prevBtn.removeClass("disabled");
        }

        if (this.isLastPage) {
            nextBtn.addClass("disabled");
        }
        else {
            nextBtn.removeClass("disabled");
        }

        nextBtn.unbind().click(() => {
            if (!this.isLastPage) {
                this.page++;
                nextBtn.removeClass("disabled");
                this.fillRequestTable();
            }
        })

        prevBtn.unbind().click(() => {
            if (this.page > 0) {
                this.page--;
                prevBtn.removeClass("disabled");
                this.fillRequestTable();
            }
        })
    }

    sendRequest() {
        $("#sent-button").click(() =>{
            var idx = 1 ;
            var numberOfRecord = $("#content-items").attr("counter");
            var requests = []

            for(idx = 1; idx <= numberOfRecord; idx++) {
                var input = 'input[name=\'opt'+idx+'\']';
                var request = {};
                if($(input).is(":checked") && !($(input).is(":disabled"))) {
                    request = {
                        idRequest : parseInt($('#data-ke-'+idx).attr("id-request")),
                        idSuperior : "\0",
                        idAdmin : this.idAdmin,
                        requestStatus : "SENT"
                    }
                    requests.push(request);
                    $(input).prop("disabled","disabled");
                }
            }
            if(requests.length > 0) {
                $.ajax({
                    method : "PUT",
                    url : "/api/requests",
                    data : JSON.stringify(requests),
                    contentType: "application/json",
                    dataType: "json",
                    success: (response) => {
                        alert("item sent!");
                        this.fillRequestTable();
                    },
                    error : (response) => {
                        console.log(response);
                    }
                });
            } else {
                alert('not request selected');
            }
        });
    }

}

// $(document).ready(()=>{
//     console.log("asdf");
//     function triggerChange() {
//         $('.chk-box').trigger("change");
//     }

//     $(".chk-box").change(function() {
//         alert("triggered!");
//      });

//     $(".chk-box").on("click",()=>{
//         console.log("clicksuccess");
//         alert("click");
//     });
//      triggerChange();
// });
