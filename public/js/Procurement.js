class Procurement {
    constructor() {
        this.page = 0;
        this.limit = 10;
        this.dropdownLimit = 5;
    }

    init() {
        $.ajax({
            method: "GET",
            url: "/api/login-detail",
            dataType: "json",
            success: (response) => {
                if (!response.isAdmin) {
                    window.location.hash = "#home";
                }
                else {
                    this.idAdmin = response.idUser;
                    this.fillTable();
                    this.detailModalHandler();
                    this.addNewTransactionHandler();
                }
            },
            statusCode: {
                401 : () => {
                    window.location = "login.html";
                }
            }
        });
    }

    paginationHandler() {
        var nextBtn = $("#page-transactions-next");
        var prevBtn = $("#page-transactions-prev");

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
                this.fillTable();
            }
        })

        prevBtn.unbind().click(() => {
            if (this.page > 0) {
                this.page--;
                this.fillTable();
                prevBtn.removeClass("disabled");
            }
        })
    }

    fillTable() {
        $.ajax({
            method: "GET",
            url: "/api/transactions",
            data: {page: this.page, limit: this.limit, sort: "transactionDate"},
            dataType: "json",
            success: (response) => {
                this.isLastPage = response.last;
                this.lastPage = response.totalPages-1;
                this.paginationHandler();
                var content = "";
                response.content.forEach(element => {
                    content += '<tr data-toggle="modal" data-target="#transaction-detail" data-idtransaction="' + element.idTransaction + '">'
                    + '<td scope="row">' + element.idTransaction + '</td>'
                    + '<td>' + element.admin.name + '</td>'
                    + '<td>' + element.supplier + '</td>';

                    var date = new Date(element.transactionDate);

                    content += '<td>' + date.toLocaleString() + '</td>';

                    var value = 0;
                    element.itemTransactions.forEach(itemTrx => {
                        value += itemTrx.boughtQty * itemTrx.price;
                    })

                    content += '<td>Rp ' + value + '</td></tr>';
                });

                $("#table-procurements tbody").html(content);
            },
            statusCode: {
                401: () => {
                    window.location = "login.html";
                }
            }
        });
    }

    detailModalHandler() {
        $("#transaction-detail").on('show.bs.modal', (event) => {
            var idTransaction = $(event.relatedTarget).data("idtransaction");
            $.ajax({
                method: "GET",
                url: "/api/transactions/" + idTransaction,
                dataType: "json",
                success: (response) => {
                    $("#transaction-detail-id").text(response.idTransaction);
                    $("#transaction-detail-supplier").text(response.supplier);

                    var date = new Date(response.transactionDate);
                    $("#transaction-detail-date").text(date.toLocaleString());

                    $("#transaction-detail-admin").text(response.admin.name + ' (' + response.admin.idUser + ')');

                    var value = 0;
                    var tableContent = '';
                    response.itemTransactions.forEach(element => {
                        value += element.boughtQty * element.price;

                        tableContent += '<tr><td scope="row">' + element.item.idItem + '</td>'
                        + '<td>' + element.item.itemName + '</td>'
                        + '<td>' + element.boughtQty + '</td>'
                        + '<td>Rp ' + element.price + '</td></tr>';
                    })
                    $("#transaction-detail-value").text(value);
                    $("#table-procurement-detail tbody").html(tableContent);
                },
                statusCode: {
                    401: () => {
                        window.location = "login.html";
                    }
                }
            });
            this.deleteHandler(idTransaction);
        })
    }

    deleteHandler(idTransaction) {
        $("#transaction-delete-invalid-feedback").attr("style", "display: none");
        $("#delete-transaction").unbind().click(() => {
            $.ajax({
                method: "DELETE",
                url: "/api/transactions",
                data: JSON.stringify({idTransaction: idTransaction}),
                contentType: "application/json",
                success: () => {
                    this.page = 0;
                    this.fillTable();
                    $("#transaction-detail").modal('hide');
                },
                statusCode: {
                    403: () => {
                        $("#transaction-delete-invalid-feedback").text("Couldn't delete this transaction, time limit exceeded").attr("style", "display: block");
                    },
                    400: () => {
                        $("#transaction-delete-invalid-feedback").text("Couldn't delete this transaction, items are being used").attr("style", "display: block");
                    }
                }
            });
        })
    }

    addNewTransactionHandler() {
        this.resetNewTransactionTable();
        this.itemTransactions = [];
        $("#add-item-transaction-modal").unbind().on('show.bs.modal', () => {
            this.resetAddItemTransactionForm();
            this.addItemTransactionFormHandler();

            $("#add-item-transaction-modal-btn").unbind().click(() => {
                var itemTransaction = {
                    item: {
                        idItem: parseInt($("#id-item-form").text()),
                        itemName: $("#form-add-item-transaction").val()
                    },
                    boughtQty: parseInt($("#form-add-item-quantity-transaction").val()),
                    price: parseInt($("#form-add-item-price-transaction").val())
                }
                if (this.validateItemTransaction(itemTransaction)) {
                    this.itemTransactions.push(itemTransaction);
                    this.fillNewTransactionTable();
                    $("#add-item-transaction-modal").modal('hide');
                }
            });
        });
        this.buyBtnHandler();

    }

    buyBtnHandler() {
        $("#form-supplier-add-transaction").unbind().on('input', () => {
            $("#form-supplier-add-transaction").removeClass("is-invalid");
        })

        $("#buy-btn").unbind().click(() => {
            if (!$("#form-supplier-add-transaction").val()) {
                $("#transaction-validation").text("Please provide a valid supplier");
                $("#form-supplier-add-transaction").addClass("is-invalid");
            }
            else {
                var request = {
                    supplier: $("#form-supplier-add-transaction").val(),
                    admin: {
                        idUser: this.idAdmin
                    },
                    itemTransactions: this.itemTransactions
                }
                if (this.itemTransactions.length > 0) {
                    $.ajax({
                        method: "POST",
                        url: "/api/transactions",
                        data: JSON.stringify(request),
                        contentType: "application/json",
                        success: (response) => {
                            this.fillTable();
                            this.resetAddItemTransactionForm();
                            this.resetNewTransactionTable();
                            $("#nav-procurements-tab").addClass("active").attr("aria-selected", "true");
                            $("#nav-create-procurement-tab").removeClass("active").attr("aria-selected", "false");
                            $("#nav-procurements").addClass("active show");
                            $("#nav-create-procurement").removeClass("active show");
                        },
                        statusCode: {
                            400: () => {
                                $("#transaction-validation").text("Bought quantity must be > 0");
                                $("#form-supplier-add-transaction").addClass("is-invalid");
                            }
                        }
                    });
                }
            }
        })
    }

    validateItemTransaction(itemTransaction) {
        var itemForm = $("#form-add-item-transaction");
        var priceForm = $("#form-add-item-price-transaction");
        var quantityForm = $("#form-add-item-quantity-transaction");

        itemForm.unbind().on('input', () => {
            itemForm.removeClass('is-invalid');
        })

        priceForm.unbind().on('input', () => {
            priceForm.removeClass('is-invalid');
        })

        quantityForm.unbind().on('input', () => {
            quantityForm.removeClass('is-invalid');
        })

        var valid = true;
        if (!itemTransaction.item.idItem) {
            valid = false;
            itemForm.addClass("is-invalid");
        }
        if (!itemTransaction.price) {
            valid = false;
            priceForm.addClass("is-invalid");
        }
        if (!itemTransaction.boughtQty) {
            valid = false;
            quantityForm.addClass("is-invalid");
        }
        return valid
    }

    fillNewTransactionTable() {
        var content = ""
        var totalPrice = 0;
        var index = 0;
        this.itemTransactions.forEach(element => {
            content += '<tr><td>' + element.item.idItem + '</td>'
            + '<td>' + element.item.itemName + '</td>'
            + '<td>' + element.boughtQty + '</td>'
            + '<td class="d-flex justify-content-between">Rp ' + element.boughtQty * element.price + '<i class="fa fa-times remove-item-transaction" data-index="' + index + '" aria-hidden="true"></i></td>';
            index++;
            totalPrice += element.boughtQty * element.price;
        })
        content += '<tr><td colspan="3" class="text-right">Total</td><td>Rp ' + totalPrice + '</td></tr>'
        $("#table-new-procurement tbody").html(content);

        $(".remove-item-transaction").unbind().click((event) => {
            var removedIdx = $(event.currentTarget).data('index');
            this.itemTransactions.splice(removedIdx, 1);
            this.fillNewTransactionTable();
        })
    }

    resetNewTransactionTable() {
        $("#table-new-procurement tbody").html('');
        $("#form-supplier-add-transaction").val('');
        this.itemTransactions = [];
    }

    resetAddItemTransactionForm() {
        $("#form-add-item-transaction").val('');
        $("#form-add-item-price-transaction").val('');
        $("#form-add-item-quantity-transaction").val('');
        $("#id-item-form").text('');
    }

    addItemTransactionFormHandler() {
        $("#form-add-item-transaction").unbind().focusin(() => {
            $('#procurement .dropdown-menu').html('<p class="dropdown-item"><strong>Insert Item</strong></p>');
        })
        $("#form-add-item-transaction").on('input', (event) => {
            $("#form-add-item-transaction").removeClass("is-invalid");
            $("#id-item-form").text("");
            if (event.target.value) {
                $.ajax({
                    type: "GET",
                    url: "/api/items",
                    data: {page: 0, limit: this.dropdownLimit, sort: "itemName", keyword: event.target.value},
                    dataType: "json",
                    success: (response) => {
                        var dropdown_content = "";
                        response.content.forEach((element) => {
                            dropdown_content += '<button class="dropdown-item candidate-item-trx" data-iditem="' + element.idItem + '" data-name="' + element.itemName + '">'
                            + '<div class="row"><div class="col-2">'
                            + '<img src="' + (element.pictureURL ? element.pictureURL : "/public/images/no-image.jpg") + '" class="img-thumbnail rounded-circle" alt=""></div>'
                            + '<div class="col-10">'
                            + '<p><strong>' + element.itemName + '</strong></p>'
                            + '<p>ID : ' + element.idItem + '</p>'
                            + '<p>Available Qty : ' + element.availableQty + '</p>'
                            + '</div></div></button>';
                        });
                        if (response.content.length > 0) {
                            $('#procurement .dropdown-menu').html(dropdown_content);
                        }
                        else {
                            $('#procurement .dropdown-menu').html('<p class="dropdown-item"><strong>Item not found</strong></p>');
                        }

                        $("#dropdown-add-item-transaction .candidate-item-trx").unbind().click((event) => {
                            event.preventDefault();
                            $("#form-add-item-transaction").val($(event.currentTarget).data('name'));
                            $("#id-item-form").text($(event.currentTarget).data('iditem'));
                        })
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
        })
    }
}