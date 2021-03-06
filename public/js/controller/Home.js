class Home {

    constructor() {
        this.itemPage = 0;
        this.itemLimit = 10;
        this.isLastPage = false;
        this.reqPage = 0;
        this.reqLimit = 10;
        this.isReqLastPage = false;
        this.dropdownLimit = 5;
    }

    init() {
        $.ajax({
            type: "GET",
            url: "/api/login-detail/",
            dataType: "json",
            success: (data, status) => {
                this.loggedInUser = data;
                this.fillUserCard(data);
                this.emptyTable();
                this.fillItemTable(data.idUser);
                this.detailModalHandler();
                this.tableHandler(data.idUser);
                this.paginationHandler(data.idUser);
                this.createRequestHandler();
            },
            statusCode: {
                401: () => {
                    window.location = "login.html";
                }
            }
        });
    }

    fillUserCard(data) {
        if (data.pictureURL) {
            $('#profile-photo').attr('src', data.pictureURL);
        } else {
            $('#profile-photo').attr('src', "public/images/profile.png");
        }
        $("#name").text(data.name);
        $("#nip").text(data.idUser);
        $("#division").text(data.division);
        $("#role").text(data.role);
        if (data.superior != null) {
            $("#superior-name").text(data.superior.name);
            $("#superior-id").text(data.superior.idUser);
        } else {
            $("#superior-name").text();
            $("#superior-id").text("No superior");
        }
    }

    fillItemTable(idUser) {
        var spinner = $("#home-item-spinner").addClass("d-block");
        var table = $("#content-items").addClass("d-none");
        $.ajax({
            method: "GET",
            url: "/api/user-items",
            data: { page: this.itemPage, limit: this.itemLimit, idUser: idUser, sort: "idUserHasItem" },
            dataType: "json",
            success: (response) => {
                var content = "";
                var count = 0;
                if (response.content.length > 0) {
                    response.content.forEach(element => {
                        content += '<tr class="' + element.requestStatus +
                            '"  data-toggle="modal" data-target="#home-item-detail" data-iditem="' + element.item.idItem
                            + '" data-itemname="' + element.item.itemName
                            + '" data-status="' + 'ITEM'
                            + '" data-idhasitem="' + element.idUserHasItem + '">'
                            + '<td>' + element.item.itemName + '</td>'
                            + '<td class="text-center">' + element.hasQty.toLocaleString('en') + '</td>'
                            + '<td class="text-center">' + "SENT" + '</td>'
                            + '</tr>';
                        count++;
                    });
                    for (var i = count; i < this.itemLimit; i++) {
                        content += '<tr style="height: 3rem"><td></td><td></td><td></td><td style="display: none">temp</td></tr>';
                    }
                    this.isLastPage = response.last;
                    if (response.last) {
                        $("#page-item-home-next").addClass("disabled");
                    }
                    else {
                        $("#page-item-home-next").removeClass("disabled");
                    }

                    if (response.first) {
                        $("#page-item-home-prev").addClass("disabled");
                    }
                    else {
                        $("#page-item-home-prev").removeClass("disabled");
                    }
                } else {
                    content = '<td colspan="3">No item available</td>';
                }
                spinner.removeClass("d-block");
                table.removeClass("d-none");
                $("#content-items").html(content);
            },
            statusCode: {
                401: () => {
                    window.location = 'login.html';
                }
            }
        });
    }

    fillCustomItemTable(idUser, status) {
        var spinner = $("#home-item-spinner").addClass("d-block");
        var table = $("#content-items").addClass("d-none");
        $.ajax({
            method: "GET",
            url: "/api/requests",
            data: { page: this.reqPage, limit: this.reqLimit, idUser: idUser, status: status.toUpperCase(), sort: "requestDate" },
            dataType: "json",
            success: (response) => {
                if (response.content.length > 0) {
                    var count = 0;
                    var content = "";
                    response.content.forEach(element => {
                        var reqQty = element.reqQty.toLocaleString('en');
                        content += '<tr class="' + element.requestStatus +
                            '"  data-toggle="modal" data-target="#home-item-detail" data-iditem="' + element.item.idItem
                            + '" data-itemname="' + element.item.itemName
                            + '" data-status="' + element.requestStatus
                            + '" data-idrequest="' + element.idRequest + '">'
                            + '<td>' + element.item.itemName + '</td>'
                            + '<td class="text-center">' + reqQty + '</td>'
                            + '<td class="text-center">' + element.requestStatus + '</td>'
                            + '</tr>';
                        count++;
                    });

                    for (var i = count; i < this.reqLimit; i++) {
                        content += '<tr style="height: 3rem"><td></td><td></td><td></td><td style="display: none">temp</td></tr>';
                    }

                    this.isReqLastPage = response.last;
                    if (response.last) {
                        $("#page-item-home-next").addClass("disabled");
                    }
                    else {
                        $("#page-item-home-next").removeClass("disabled");
                    }

                    if (response.first) {
                        $("#page-item-home-prev").addClass("disabled");
                    }
                    else {
                        $("#page-item-home-prev").removeClass("disabled");
                    }
                } else {
                    content = '<td colspan="3">No request available</td>';
                }
                $("#content-items").html(content);
                spinner.removeClass("d-block");
                table.removeClass("d-none");
            },
            statusCode: {
                401: () => {
                    window.location = "login.html";
                }
            }
        })
    }

    fillRequestItemTable(idUser) {
        var spinner = $("#home-item-spinner").addClass("d-block");
        var table = $("#content-items").addClass("d-none");
        $.ajax({
            method: "GET",
            url: "/api/requests",
            data: { page: this.reqPage, limit: this.reqLimit, idUser: idUser, sort: "requestDate" },
            dataType: "json",
            success: (response) => {
                var count = 0;
                if (response.content.length > 0) {
                    var content = "";
                    response.content.forEach(element => {
                        var reqQty = element.reqQty.toLocaleString('en');
                        content += '<tr class="' + element.requestStatus +
                            '"  data-toggle="modal" data-target="#home-item-detail" data-iditem="' + element.item.idItem
                            + '" data-itemname="' + element.item.itemName
                            + '" data-status="' + element.requestStatus
                            + '" data-idrequest="' + element.idRequest + '">'
                            + '<td>' + element.item.itemName + '</td>'
                            + '<td class="text-center">' + reqQty + '</td>'
                            + '<td class="text-center">' + element.requestStatus + '</td>'
                            + '</tr>';
                        count++;
                    });
                    for (var i = count; i < this.reqLimit; i++) {
                        content += '<tr style="height: 3rem"><td></td><td></td><td></td><td style="display: none">temp</td></tr>';
                    }
                    this.isReqLastPage = response.last;
                    if (response.last) {
                        $("#page-item-home-next").addClass("disabled");
                    }
                    else {
                        $("#page-item-home-next").removeClass("disabled");
                    }

                    if (response.first) {
                        $("#page-item-home-prev").addClass("disabled");
                    }
                    else {
                        $("#page-item-home-prev").removeClass("disabled");
                    }
                } else {
                    content = '<td colspan="3">No request available</td>';
                }
                $("#content-items").html(content);
                spinner.removeClass("d-block");
                table.removeClass("d-none");
            },
            statusCode: {
                401: () => {
                    window.location = "login.html";
                }
            }
        });
    }

    tableHandler(idUser) {
        $(".filter").change(() => {
            var status = $(".filter").val();
            this.emptyTable();
            if (status == "item") {
                this.fillItemTable(idUser);
            } else if (status == "allreq") {
                this.fillRequestItemTable(idUser);
            } else {
                this.fillCustomItemTable(idUser, status);
            }
        });
    }

    fillHomeItemDetail(idItem) {
        var spinner = $("#home-item-detail-spinner").addClass("d-block");
        var header = $("#home-item-detail .modal-header").addClass("d-none");
        var body = $("#home-item-detail .modal-body").addClass("d-none");
        $.ajax({
            type: "GET",
            url: "/api/items/" + idItem,
            dataType: "json",
            success: (response) => {
                var price = response.price.toLocaleString('en');
                var totalQty = response.totalQty.toLocaleString('en');
                var availableQty = response.availableQty.toLocaleString('en');
                $("#item-detail-name").text(response.itemName);
                if (response.pictureURL) {
                    $("#img-detail-item-home").attr("src", response.pictureURL);
                }
                else {
                    $("#img-detail-item-home").attr("src", "/public/images/no-image.jpg");
                }
                $("#detail-item #item-price").text(price);
                $("#detail-item #item-total-qty").text(totalQty);
                $("#detail-item #item-available-qty").text(availableQty);
                $("#detail-item #item-description").text(response.description);
                spinner.removeClass("d-block");
                header.removeClass("d-none");
                body.removeClass("d-none");
            },
            statusCode: {
                404: () => {
                    spinner.removeClass("d-block");
                    header.removeClass("d-none");
                    body.removeClass("d-none");
                    body.text('This item has been deleted')
                },
                401: () => {
                    window.location = "login.html";
                }
            }
        });
    }

    emptyHomeItemDetail() {
        $("#detail-item").html('');
        $("#item-detail-name").html('');
    }

    detailModalHandler() {
        $("#home-item-detail").unbind().on('show.bs.modal', (event) => {
            var idItem = $(event.relatedTarget).data('iditem');
            var status = $(event.relatedTarget).data('status');
            this.fillHomeItemDetail(idItem);

            if (status != "ITEM" && status != "item") {
                var buttonreturn = $('#return-btn');
                buttonreturn.addClass("d-none");
            }
            else {
                var buttonreturn = $('#return-btn');
                buttonreturn.removeClass("d-none");
            }

            $("#return-btn").unbind().click(() => {
                if (confirm("Are you sure you want to return " + $(event.relatedTarget).data('itemname') + '?')) {
                    var deleteditem = {
                        idUserHasItem: $(event.relatedTarget).data('idhasitem')
                    };
                    $.ajax({
                        method: "DELETE",
                        url: "/api/user-items",
                        data: JSON.stringify(deleteditem),
                        contentType: "application/json",
                        success: (response) => {
                            $("#home-item-detail").modal('hide');
                            this.emptyTable();
                            $(".filter").val("allreq");
                            this.fillItemTable(this.loggedInUser.idUser);
                        },
                        statusCode: {
                            401: () => {
                                window.location = "login.html";
                            }
                        }
                    });
                }
            });
        });
    }

    paginationHandler(idUser) {
        $("#page-item-home-prev:not(.disabled)").unbind().click(() => {
            if ($(".filter").val() == "sent") {
                if (this.itemPage > 0) {
                    this.itemPage--;
                    this.fillItemTable(idUser);
                    if (this.itemPage == 0) {
                        $("#page-item-home-prev").addClass("disabled");
                    }
                }
            } else if ($(".filter").val() == "allreq") {
                if (this.reqPage > 0) {
                    this.reqPage--;
                    this.fillRequestItemTable(idUser);
                    if (this.reqPage == 0) {
                        $("#page-item-home-prev").addClass("disabled");
                    }
                }
            } else {
                var status = $(".filter").val();
                if (this.reqPage > 0) {
                    this.reqPage--;
                    this.fillCustomItemTable(idUser, status);
                    if (this.reqPage == 0) {
                        $("#page-item-home-prev").addClass("disabled");
                    }
                }
            }
        })



        $("#page-item-home-next:not(.disabled").unbind().click(() => {
            if ($(".filter").val() == "sent") {
                if (!this.isLastPage) {
                    this.itemPage++;
                    this.fillItemTable(idUser);
                    if (this.isLastPage) {
                        $("#page-item-home-next").addClass("disabled");
                    }
                }
            } else if ($(".filter").val() == "allreq") {
                if (!this.isReqLastPage) {
                    this.reqPage++;
                    this.fillRequestItemTable(idUser);
                    if (this.isReqLastPage) {
                        $("#page-item-home-next").addClass("disabled");
                    }
                }
            } else {
                var status = $(".filter").val();
                if (!this.isReqLastPage) {
                    this.reqPage++;
                    this.fillCustomItemTable(idUser, status);
                    if (this.isReqLastPage) {
                        $("#page-item-home-next").addClass("disabled");
                    }
                }
            }
        })
    }

    emptyTable() {
        var content = "";
        $("#content-items").html(content);
    }

    createRequestHandler() {
        $("#add-request").on('show.bs.modal', () => {
            this.requestItems = [];
            $("#add-new-request-invalid-feedback").removeClass("d-block");
            this.fillCreateRequestTable();
            this.searchHandler();
            this.submitRequestHandler();
        });
    }

    submitRequestHandler() {
        $("#add-request-btn").unbind().click(() => {
            var requestBody = {
                idUser: this.loggedInUser.idUser,
                items: this.requestItems
            };
            $.ajax({
                method: "POST",
                url: "/api/requests",
                data: JSON.stringify(requestBody),
                contentType: "application/json",
                success: () => {
                    this.fillItemTable(this.loggedInUser.idUser);
                    $("#add-request").modal('hide');
                },
                statusCode: {
                    401: () => {
                        window.location = 'login.html';
                    },
                    400: () => {
                        $("#add-new-request-invalid-feedback").addClass("d-block");
                    }
                }
            });
        });
    }


    addRequestItems(idItem) {
        $.ajax({
            method: "GET",
            url: "/api/items/" + idItem,
            dataType: "json",
            success: (response) => {
                this.requestItems.push({
                    item: response,
                    requestQty: 1
                });
                this.fillCreateRequestTable();
            },
            statusCode: {
                401: () => {
                    window.location = "login.html";
                }
            }
        });
    }

    fillCreateRequestTable() {
        var content = '';
        var index = 0;
        this.requestItems.forEach((element) => {
            var requestQty = element.requestQty.toLocaleString('en');
            var availableQty = element.item.availableQty.toLocaleString('en');
            content += '<tr><td class="text-center">' + element.item.idItem + '</td>'
                + '<td>' + element.item.itemName + '</td>'
                + '<td class="target-item-request text-center"><input type="number" data-index="' + index + '" id="item-request-' + element.item.idItem + '" max="' + availableQty
                + '" style="width: 3rem" min="1" value="' + requestQty + '"></td>'
                + '<td class="text-center" style="width: 3rem"><i class="fa fa-times remove-item-transaction" data-index="' + index + '" aria-hidden="true"></i></td></tr>';
            index++;
        });
        $("#content-create-request-items").html(content);
        $(".remove-item-transaction").unbind().click(event => {
            var removeIdx = $(event.currentTarget).data('index');
            this.requestItems.splice(removeIdx, 1);
            this.fillCreateRequestTable();
        });
        $(".target-item-request input").unbind().on('mouseup keyup change', (event) => {
            var idx = $(event.currentTarget).data('index');
            this.requestItems[idx].requestQty = parseInt(event.currentTarget.value);
        });
    }

    searchHandler() {
        $("#form-add-item-request").unbind().focusin(() => {
            $('#home .dropdown-menu').html('<p class="dropdown-item"><strong>Insert Item</strong></p>');
        });
        $("#form-add-item-request").on('input', (event) => {
            $("#form-add-item-request").removeClass("is-invalid");
            $("#id-item-form").text("");
            if (event.target.value) {
                $.ajax({
                    type: "GET",
                    url: "/api/items",
                    data: { page: 0, limit: this.dropdownLimit, sort: "itemName", keyword: event.target.value, minqty: 0 },
                    dataType: "json",
                    success: (response) => {
                        var dropdown_content = "";
                        response.content.forEach((element) => {
                            var availableQty = element.availableQty.toLocaleString('en');
                            dropdown_content += '<button class="dropdown-item candidate-item-trx" data-iditem="' + element.idItem + '" data-name="' + element.itemName + '">'
                                + '<div class="row"><div class="col-2">'
                                + '<img src="' + (element.pictureURL ? element.pictureURL : "/public/images/no-image.jpg") + '" class="img-thumbnail rounded-circle d-block mx-auto" alt=""></div>'
                                + '<div class="col-10">'
                                + '<p><strong>' + element.itemName + '</strong></p>'
                                + '<p>ID : ' + element.idItem + '</p>'
                                + '<p>Available Qty : ' + availableQty + '</p>'
                                + '</div></div></button>';
                        });
                        if (response.content.length > 0) {
                            $('#home .dropdown-menu').html(dropdown_content);
                        }
                        else {
                            $('#home .dropdown-menu').html('<p class="dropdown-item"><strong>Item not found</strong></p>');
                        }

                        $("#dropdown-add-item-request .candidate-item-trx").unbind().click((event) => {
                            event.preventDefault();
                            $("#form-add-item-request").val("");
                            this.addRequestItems(parseInt($(event.currentTarget).data('iditem')));
                        });
                    },
                    statusCode: {
                        401: () => {
                            window.location = "login.html";
                        }
                    }
                });
            }
            else {
                $('#dropdown-add-item-transaction').html('<p class="dropdown-item"><strong>Insert Item</strong></p>');
            }
        });
    }
}
