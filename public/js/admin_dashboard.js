class AdminDashboard {
    constructor() {
        this.itemPage = 0;
        this.itemLimit = 10;
        this.isLastPageItem = false;

        this.employeePage = 0;
        this.employeeLimit = 10;
        this.employeePageLast = false;
    }
    init() {
        this.detailItemModalHandler();
        this.addItemModalHandler();
        this.fillItemTable();
        this.itemPaginationHandler();
    }

    itemPaginationHandler() {
        $("#page-item-prev:not(.disabled)").unbind().click(() => {
            if (this.itemPage > 0) {
                this.itemPage--;
                this.fillItemTable();
                if (this.itemPage == 0) {
                    $("#page-item-prev").addClass("disabled");
                }
            }
        })

        $("#page-item-next:not(.disabled").unbind().click(() => {
            if (this.itemPage < this.itemLimit && !this.isLastPageItem) {
                this.itemPage++;
                this.fillItemTable();
                if (this.itemPage == this.itemLimit || this.isLastPageItem) {
                    $("#page-item-next").addClass("disabled");
                }
            }
        })
    }

    fillItemTable() {
        $.ajax({
            method: "GET",
            url: "/api/items",
            data: {page: this.itemPage, limit: this.itemLimit, sort:"idItem"},
            dataType: "json",
            success: (response) => {
                var content = "";
                response.content.forEach(element => {
                    content += '<tr data-toggle="modal" data-target="#item-detail" data-iditem="' + element.idItem + '">'
                    + '<td scope="row">' + element.idItem + '</td>'
                    + '<td>' + element.itemName + '</td>'
                    + '<td>Rp' + element.price + '</td>'
                    + '<td class="text-center">' + element.totalQty + '</td>'
                    + '<td class="text-center">' + element.availableQty + '</td>'
                    + '</tr>';
                });
                this.isLastPageItem = response.last;
                this.lastPageItem = response.totalPages-1;
                if (response.last) {
                    $("#page-item-next").addClass("disabled");
                }
                else {
                    $("#page-item-next").removeClass("disabled");
                }

                if (response.first) {
                    $("#page-item-prev").addClass("disabled");
                }
                else {
                    $("#page-item-prev").removeClass("disabled");
                }

                $("#item tbody").html(content);
            },
        });
    }

    fillItemDetail(idItem) {
        $.ajax({
            type: "GET",
            url: "/api/items/" + idItem,
            dataType: "json",
            success: (response) => {
                $("#itemDetailId").text(response.itemName);
                if (response.pictureURL != '') {
                    $("#detail-item img").attr("src", response.pictureURL);
                }
                else {
                    $("#detail-item img").attr("src", "/public/images/no-image.jpg");
                }
                $(".item-price").text(response.price);
                $(".item-total-qty").text(response.totalQty);
                $(".item-available-qty").text(response.availableQty);
                $(".item-description").text(response.description);
                $("#update-item img").attr("src", $("#detail-item img").attr("src"));
                $("#form-update-item-name").val($("#itemDetailId").text());
                $("#form-update-item-price").val($(".item-price").text());
                $("#form-update-item-totalqty").val($(".item-total-qty").text());
                $("#form-update-item-description").val($(".item-description").text())
            },
            responseStatus : {
                401 : () => {
                    window.location = "login.html";
                }
            }
        });
    }

    detailItemModalHandler() {
        $("#item-detail").unbind().on('show.bs.modal', (event) => {
            var idItem = $(event.relatedTarget).data('iditem');
            this.fillItemDetail(idItem);
            $(".update-btn").unbind().click(() => {
                $("#detail-item").css("display", "none");
                $("#update-item").css("display", "block");
                $(".modal-header").css("display", "none");
                this.updateItemFormHandler(idItem);

            });

            $(".delete-btn").unbind().click(() => {
                this.deleteItem(idItem);
            })


        });
    }

    updateItemFormHandler(idItem) {
        $("#item-update-image-uploader").unbind().change(() => {
            var formData = new FormData($("#update-item form")[0]);
            var imageUrl = Helper.uploadFile(formData);
            $("#update-item img").attr("src", imageUrl);
            $("#detail-item img").attr("src", imageUrl);
        })

        $("#update-item .save-update-btn").unbind().click((event) => {
            event.preventDefault();
            var request = {
                itemName: $("#form-update-item-name").val(),
                description: $("#form-update-item-description").val(),
                pictureURL: $("#update-item img").attr("src"),
                price: $("#form-update-item-price").val(),
                totalQty: $("#form-update-item-totalqty").val()
            }

            if (this.validateRequest(request)) {
                this.updateItem(request, idItem);
            }
        })
    }

    updateItem(request, idItem) {
        $.ajax({
            method: "PUT",
            url: "/api/items/" + idItem,
            data: JSON.stringify(request),
            contentType: "application/json",
            dataType: "json",
            success: (response) => {
                this.fillItemDetail(idItem);
                this.fillItemTable();
                $("#detail-item").css("display", "block");
                $("#update-item").css("display", "none");
                $(".modal-header").css("display", "flex");
            },
            statusCode: {
                409: () => {
                    $(".item-invalid-feedback").text("Item name already exists");
                    $("#form-update-item-name").addClass("is-invalid");
                },
                400: () => {
                    $(".invalid-totalqty").text("Total quantity must be more than or equal number of used items")
                    $("#form-update-item-totalqty").addClass("is-invalid");
                }
            }
        });
    }

    addItemModalHandler() {
        $("#add-item").unbind().on('show.bs.modal', () => {
            this.addItemFormHandler();
            $("#bulk-item-entries label").text("Choose CSV File");
            $("#upload-bulk-item-entries").val('');
            $("#upload-bulk-item-entries").removeClass("is-invalid");
            $("#upload-bulk-item-entries").unbind().change((event) => {
                var files = event.target.files;
                $("#bulk-item-entries label").text(files[0].name);
                this.addBulkItemHandler(files[0]);
            })
        })
    }


    addBulkItemHandler(file) {
        var reader = new FileReader();
        reader.readAsText(file);
        reader.onload = (event) => {
            var csv = event.target.result;
            var data = $.csv.toArrays(csv);
            var requests = [];
            for (var value in data) {
                var request = {
                    itemName: data[value][0],
                    price: parseInt(data[value][1]),
                    totalQty: parseInt(data[value][2]),
                    description: data[value][3],
                    pictureURL: data[value][4]
                }
                requests.push(request);
            }
            $(".save-update-bulk-btn").unbind().click(() => {
                if (this.bulkEntriesItemValidation(requests)) {
                    this.addItem(requests, true)
                }
            })
        }
        reader.onerror = () => {
            $(".item-invalid-feedback").text("Unable to read " + file.name);
            $(".item-form-name").addClass("is-invalid");
        }
    }

    addItemFormHandler() {
        var imageUrl = '';
        $("#item-add-image-uploader").unbind().change(() => {
            var formData = new FormData($("#add-item form")[0]);
            imageUrl = Helper.uploadFile(formData);
            $("#add-item img").attr("src", imageUrl);
        })
        $("#add-item .save-update-btn").unbind().click((event) => {
            event.preventDefault();
            var requests = [{
                itemName: $("#form-add-item-name").val(),
                description: $("#form-add-item-description").val(),
                pictureURL: imageUrl,
                price: $("#form-add-item-price").val(),
                totalQty: $("#form-add-item-totalqty").val()
            }]
            var validated = this.singleEntryItemValidation(requests[0]);
            if (validated) {
                this.addItem(requests, false);
            }
        })
    }

    singleEntryItemValidation(request) {
        var valid = true;
        $(".item-form-name").unbind().change(() => {
            $(".item-form-name").removeClass("is-invalid");
        });

        $(".item-form-price").unbind().change(() => {
            $(".item-form-price").removeClass("is-invalid");
        });

        $(".item-form-totalqty").unbind().change(() => {
            $(".item-form-totalqty").removeClass("is-invalid");
        });

        $(".item-form-description").unbind().change(() => {
            $(".item-form-description").removeClass("is-invalid");
        });

        if (request.itemName == "") {
            $(".item-invalid-feedback").text("Please provide an item name");
            $(".item-form-name").addClass("is-invalid");
            valid = false;
        }
        if (request.description == "") {
            $(".item-form-description").addClass("is-invalid");
            valid = false;
        }
        if (request.price == "") {
            $(".item-form-price").addClass("is-invalid");
            valid = false;
        }
        if (request.totalQty == "") {
            $(".item-form-totalqty").addClass("is-invalid");
            valid = false;
        }
        return valid;
    }

    bulkEntriesItemValidation(requests) {
        var upload_form = $("#upload-bulk-item-entries");
        var invalid_feedback = $("#bulk-item-entry-invalid-feedback");
        upload_form.unbind().change(function () {
            upload_form.removeClass("is-invalid");
        });
        var valid = true;
        for (var request in requests) {
            if (!requests[request].itemName || !requests[request].description || !requests[request].price || !requests[request].totalQty) {
                upload_form.addClass("is-invalid");
                invalid_feedback.text("Invalid input! All item name, description, price, and total quantity fields must be filled");
                valid = false;
            }
        }
        return valid;
    }

    addItem(requests, isBulkEntries) {
        $.ajax({
            method: "POST",
            url: "/api/items",
            data: JSON.stringify(requests),
            dataType: "json",
            contentType: "application/json",
            success: (response) => {
                this.itemPage = 0;
                this.fillItemTable();
                $("#form-add-item-name").val('');
                $("#form-add-item-description").val('');
                $("#form-add-item-price").val('');
                $("#form-add-item-totalqty").val('');
                $("#item-add-image-uploader").val('');
                $("#add-item img").attr("src", "/public/images/no-image.jpg");
                $("#add-item").modal('hide');
            },
            statusCode: {
                409: () => {
                    if (isBulkEntries) {
                        $("#upload-bulk-item-entries").addClass("is-invalid");
                        $("#bulk-item-entry-invalid-feedback").text("Item name must be unique")
                    }
                    else {
                        $(".item-invalid-feedback").text("Item name already exists");
                        $("#form-add-item-name").addClass("is-invalid");
                    }

                }
            }
        });
    }

    deleteItem(idItem) {
        $.ajax({
            method: "DELETE",
            url: "/api/items",
            data: JSON.stringify({idItem: idItem}),
            contentType: "application/json",
            success: () => {
                this.itemPage = 0;
                this.fillItemTable();
                $("#item-detail").modal('hide');
            }
        });
    }
}
