'use strict';
var data;
var formData;
var fileList;
var zip = new JSZip();
var cardUrls = [];

var cardUrlsB = [];
var loadBar;
var complateACard = true;

var pdfImageAs = [];
//var pdf = new jsPDF('l', 'mm', [297, 210], true);
var pdfImageBs = [];

//var canvas = document.getElementById("cardACanvasPreview");
//var canvasB = document.getElementById("cardBCanvasPreview");

var pdfFile;

var csvRowCount = 0;

var CARD_MEASUREMENTS = {
    CARD_WIDTH: 5.5,
    CARD_HEIGHT: 3.718,
    CARD_MARGIN: 0.1295,
    PAPER_MAGIN: 0.037,
    QR_BODER_WIDTH: 0.0555,
    CARD_FRONT: {
        IMAGES_MAGIN: 0.185,
        IMAGE_ONE_WIDTH: 3.5668,
        IMAGE_ONE_HEIGHT: 2.664,
        IMAGE_ONE_X: function () {
            return CARD_MEASUREMENTS.CARD_MARGIN + CARD_MEASUREMENTS.PAPER_MAGIN;
        },
        IMAGE_ONE_Y: function () {
            return CARD_MEASUREMENTS.CARD_MARGIN + CARD_MEASUREMENTS.PAPER_MAGIN;
        },
        IMAGE_TWO_WIDTH: 1.406,
        IMAGE_TWO_HEIGHT: 1.258,
        IMAGE_TWO_X: function () {
            return CARD_MEASUREMENTS.CARD_WIDTH - CARD_MEASUREMENTS.CARD_MARGIN - this.IMAGE_TWO_WIDTH;
        },
        IMAGE_TWO_Y: function () {
            return CARD_MEASUREMENTS.CARD_MARGIN + CARD_MEASUREMENTS.PAPER_MAGIN;
        },
        IMAGE_THREE_WIDTH: 0.925,
        IMAGE_THREE_HEIGHT: 0.703,
        IMAGE_THREE_X: function () {
            return CARD_MEASUREMENTS.CARD_MARGIN + CARD_MEASUREMENTS.PAPER_MAGIN;
        },
        IMAGE_THREE_Y: function () {
            return CARD_MEASUREMENTS.CARD_HEIGHT - this.IMAGE_THREE_HEIGHT - CARD_MEASUREMENTS.CARD_MARGIN;
        },
        IMAGE_FOUR_WIDTH: 0.925,
        IMAGE_FOUR_HEIGHT: 0.703,
        IMAGE_FOUR_X: function () {
            return CARD_MEASUREMENTS.CARD_MARGIN + CARD_MEASUREMENTS.PAPER_MAGIN + this.IMAGE_THREE_WIDTH + this.IMAGES_MAGIN;
        },
        IMAGE_FOUR_Y: function () {
            return CARD_MEASUREMENTS.CARD_HEIGHT - this.IMAGE_FOUR_HEIGHT - CARD_MEASUREMENTS.CARD_MARGIN;
        },
        IMAGE_FIVE_WIDTH: 0.925,
        IMAGE_FIVE_HEIGHT: 0.703,
        IMAGE_FIVE_X: function () {
            return CARD_MEASUREMENTS.CARD_MARGIN + CARD_MEASUREMENTS.PAPER_MAGIN + this.IMAGE_THREE_WIDTH + this.IMAGE_FOUR_WIDTH + this.IMAGES_MAGIN * 2;
            
        },
        IMAGE_FIVE_Y: function () {
            return CARD_MEASUREMENTS.CARD_HEIGHT - this.IMAGE_FIVE_HEIGHT - CARD_MEASUREMENTS.CARD_MARGIN;
        },
        QR_CODE_SECTION_WIDTH: 1.5,
        QR_CODE_SECTION_HEIGHT: 1.5,
        QR_CODE_SECTION_X: function () {
            return CARD_MEASUREMENTS.CARD_WIDTH - CARD_MEASUREMENTS.CARD_MARGIN - this.QR_CODE_SECTION_WIDTH;
        },
        QR_CODE_SECTION_Y: function () {
            return CARD_MEASUREMENTS.CARD_HEIGHT - CARD_MEASUREMENTS.CARD_MARGIN - this.QR_CODE_SECTION_HEIGHT;
        }

    },
    CARD_BACK: {
        NAME_SECTION_WIDTH: 5.0,
        NAME_SECTION_HEIGHT: 2.0,
        NUM_ID_POSX: 1.651,
        QR_CODE_SIZE: 1.295,
        TEXT_LINE_SPACE: 0.054,
        NAME_SECTION_X: function () {
            return CARD_MEASUREMENTS.CARD_MARGIN + CARD_MEASUREMENTS.PAPER_MAGIN;
        },
        NAME_SECTION_Y: function () {
            return CARD_MEASUREMENTS.CARD_MARGIN + CARD_MEASUREMENTS.PAPER_MAGIN;
        },
        AUTHOR_SECTION_WIDTH: 3.25,
        AUTHOR_SECTION_HEIGHT: 1.0,
        AUTHOR_SECTION_X: function () {
            return CARD_MEASUREMENTS.CARD_MARGIN;
        },
        AUTHOR_SECTION_Y: function () {
            return CARD_MEASUREMENTS.CARD_HEIGHT - this.AUTHOR_SECTION_HEIGHT - this.NUMERICAL_ID_SECTION_HEIGHT - (2 * CARD_MEASUREMENTS.CARD_MARGIN);
        },
        NUMERICAL_ID_SECTION_WIDTH: 3.25,
        NUMERICAL_ID_SECTION_HEIGHT: 0.3,
        NUMERICAL_ID_SECTION_X: function () {
            return this.NUM_ID_POSX;
        },
        NUMERICAL_ID_SECTION_Y: function () {
            return CARD_MEASUREMENTS.CARD_HEIGHT - this.NUMERICAL_ID_SECTION_HEIGHT - CARD_MEASUREMENTS.CARD_MARGIN;
        },
        QR_CODE_SECTION_WIDTH: 1.8,
        QR_CODE_SECTION_HEIGHT: 1.8,
        QR_CODE_SECTION_X: function () {
            return CARD_MEASUREMENTS.CARD_WIDTH - CARD_MEASUREMENTS.CARD_MARGIN - this.QR_CODE_SECTION_WIDTH;
        },
        QR_CODE_SECTION_Y: function () {
            return CARD_MEASUREMENTS.CARD_HEIGHT - CARD_MEASUREMENTS.CARD_MARGIN - this.QR_CODE_SECTION_HEIGHT;
        },

        TEXT_B_WIDTH: 0.592,
        TEXT_B_HEIGHT: 0.222
    }
};

const searchInputHtml = '<input type="text" class="tableSearchInput" onkeyup="tableSearch(this)" placeholder="Search data..." title="Type in a name">';
var tableHeaderRow;
var fixedHeaderTable;
var fixedHeaderIsDisplayed = false;
var cardsComplete = false;
var isLastProcess = false;

var folderName;
var csvFileName;
var AudioPlayer = (function () {
    function AudioPlayer(src) {
        this.audio = !!src ? new AudioPlayer(src) : new AudioPlayer();
        this.play = function () {
            //audio
        };
    };

})

var Queue = (function () {
    function Queue() {
    };
    Queue.prototype.running = false;
    Queue.prototype.queue = [];
    Queue.prototype.addFunction = function (callback) {
        var _this = this;
        this.queue.push(function () {
            var complete = callback();
            if (typeof complete === "undefined" || complete)
                _this.next();
        });
        if (!this.running)
            this.next();
        return this;
    }
    Queue.prototype.next = function () {
        this.running = false;
        var shift = this.queue.shift();
        if (shift) {
            this.running = true;
            shift();
        }
    }
    return Queue;
})();

var progressQueue = new Queue;

var ProgressBar = (function () {
    function ProgressBar(iterations, barId, labelId, callback) {
        var progressBarElement = typeof barId === 'undefined' ? document.getElementById("loadBar") : document.getElementById(barId);
        var labelBarElement = typeof labelId === 'undefined' ? document.getElementById("loadBarLabel") : document.getElementById(labelId);
        var maxFrameWidth = 51 / iterations;
        var totalWidth = 0;
        var updating = false;
        var updateCallsQueue = 0;

        var speed = 1 / 10;
        
        var updateCount = 0;
        progressBarElement.style.width = '0';
        labelBarElement.innerHTML = '';

        this.update = function () {
            updateCallsQueue++;
            if (!updating) nextUpdate();
        };

        function nextUpdate() {
            updating = false;
            if (updateCallsQueue > 0) {
                updating = true;
                //console.log("next update" + totalWidth + " == " + isLastProcess + " == " + updateCallsQueue);
                updateProgressBar();
                updateCallsQueue--;
            }
        }
        function updateProgressBar() {
            var currentFrameWidth = 0;
            var frameUpdateInterval = setInterval(function () {
                if (!isLastProcess){
                    
                    if (currentFrameWidth >= maxFrameWidth) {
                        clearInterval(frameUpdateInterval);
                        if (totalWidth >= 50) {
                            isLastProcess = true;
                            //return;
                        }
                        nextUpdate();
                    } else {
                        updateCount++;
                //console.log(" update222 - " + csvRowCount + " == " + updateCount);
                        speed = 50 / csvRowCount / 7;
                        if (speed > 0.1)
                            speed = 0.1;
                        currentFrameWidth += speed;
                        if (totalWidth < 50) {
                            totalWidth += speed;
                            progressBarElement.style.width = totalWidth + '%';
                            labelBarElement.innerHTML = Math.floor(totalWidth) + '%';
                        }
                        else{
                            isLastProcess = true;
                            return;
                        }
                    }
                }
                else{
                    currentFrameWidth += 1 / 20;
                    if (totalWidth < 100) {
                        totalWidth += 1 / 20;
                        progressBarElement.style.width = totalWidth + '%';
                        labelBarElement.innerHTML = Math.floor(totalWidth) + '%';
                    }
                    else{
                        isLastProcess = true;
                        labelBarElement.innerHTML = 'Object to Audio Builder';
                        if (typeof callback !== 'undefined') callback();
                        return;
                    }
                }
                
            }, 10);
        }
    }
    return ProgressBar;
})();

window.onscroll = function () {
    if (typeof tableHeaderRow !== 'undefined') {
        var currentPositionFromTop = tableHeaderRow.getBoundingClientRect().top;

        if (!fixedHeaderIsDisplayed && currentPositionFromTop <= 0) {
            tableHeaderRow.style.visibility = "hidden";
            fixedHeaderTable.style.display = 'initial';
            document.getElementById('stickyDiv').scrollLeft = document.getElementById('tableDiv').scrollLeft;
            fixedHeaderIsDisplayed = true;
        } else if (fixedHeaderIsDisplayed && currentPositionFromTop > 0) {
            tableHeaderRow.style.visibility = 'visible';
            fixedHeaderTable.style.display = 'none';
            fixedHeaderIsDisplayed = false;
        }
    }
};
function tableSearch(filter) {
    var searchInputInstances, table, tableRows, tableCell, tr, td, i;

    searchInputInstances = document.getElementsByClassName('tableSearchInput');
    //searchInputInstances[0] = filter;
    //searchInputInstances[1] = filter;
    table = document.getElementById('dataTable');
    tr = table.getElementsByTagName('tr');
    tableRows = table.rows;
    for (i = 0; i < tableRows.length; i++) {
        td = tr[i].getElementsByTagName('td')[0];
        tableCell = tableRows[i].cells[0];
        if (tableCell) {
            if (RegExp(filter, 'im').test(tableCell.innerHTML)) {
                //tableRows[i].classList.toggle('visible-rows');
                tableRows[i].style.display = '';
            } else {
                //tableRows[i].classList.toggle('visible-rows');
                tableRows[i].style.display = 'none';
            }
        }
    }
}

function createStickyTable() {
    if (document.body.contains(document.getElementById('dataTable'))) {
        tableHeaderRow = document.getElementById('dataTable').rows[0];
        var tableDiv = document.getElementById('tableDiv');
        var tableHeaderRowsLength = tableHeaderRow.cells.length;
        var tableHeaderElement = document.getElementById('dataTable').getElementsByTagName('th')[0];
        var tableHeaderBorderWidth = parseInt(window.getComputedStyle(tableHeaderElement, null).getPropertyValue('border-width'), 10);
        var tableHeaderPadding = parseInt(window.getComputedStyle(tableHeaderElement, null).getPropertyValue('padding-left'), 10);
        fixedHeaderTable = document.createElement('div');
        fixedHeaderTable.id = 'stickyDiv';
        fixedHeaderTable.innerHTML = '<table id="stickyTable" class="tables">' + searchInputHtml + '<tr>' + tableHeaderRow.innerHTML + '</tr></table>';
        tableDiv.appendChild(fixedHeaderTable);
        var stickyTable = document.getElementById('stickyTable');
        fixedHeaderTable.style.display = 'none';
        stickyTable.rows[0].style.height = tableHeaderRow.offsetHeight + 'px';
        for (var i = 0; i < tableHeaderRowsLength; i++) {
            if (i == 0 || i == tableHeaderRowsLength - 1)
                stickyTable.rows[0].cells[i].style.width = (tableHeaderRow.cells[i].offsetWidth - tableHeaderPadding * 2 - tableHeaderBorderWidth) + 'px';
            else
                stickyTable.rows[0].cells[i].style.width =
                    (tableHeaderRow.cells[i].offsetWidth -
                        tableHeaderPadding * 2 - tableHeaderBorderWidth) + 'px';
        }
        //document.getElementById('stickyDiv').scrollLeft = this.scrollLeft;
        fixedHeaderTable.scrollLeft = tableDiv.scrollLeft;
        tableDiv.addEventListener('scroll', function () {
            fixedHeaderTable.scrollLeft = this.scrollLeft;
        });
    }
}

function textValidate(_this) {
    //var cardFolderName = document.getElementById('cardFolderName');
    _this.value = _this.value.replace(/[^A-Za-z]/, '');
}

function focusOutInput() {
    var cardFolderName = document.getElementById('cardFolderName');
    if (cardFolderName.value == '')
        cardFolderName.value.replace('', 'Caura');
}
function toggleForm(checked) {
    var dataFormFieldElement = document.getElementById("dataFormField");
    if (checked) {
        dataFormFieldElement.disabled = true;
        document.forms['cardForm'].reset();
    } else
        dataFormFieldElement.disabled = false;
}

function downloadData() {
/*
    var canvasName = "cardACanvasPreview0";
    var canvas = document.getElementById(canvasName);
    var canvasNameB = "cardBCanvasPreview0";
    var canvasB = document.getElementById(canvasNameB);
    var imgDataA = canvas.toDataURL("image/jpeg", 0.01);
    var imgDataB = canvasB.toDataURL("image/jpeg", 0.01);
    var pdf = new jsPDF('l', 'mm', [297, 210], true);
    const pdfWidth = pdf.internal.pageSize.width;*/
    var pdf = new jsPDF('l', 'mm', [297, 210], true);
    for(var i = 1; i < pdfImageAs.length; i++){
        
        pdf.setPage(i * 2 - 1);
        //  pdf.addImage(imgDataA, 'JPEG', 6, 6, 297, 0);
        pdf.addImage(pdfImageAs[i], 'JPEG', 6, 6, 285, 198);
        pdf.addPage();
        pdf.setPage(i * 2);
        pdf.addImage(pdfImageBs[i], 'JPEG', 6, 6, 285, 198);

        // pdf.addPage();
        // pdf.setPage(3);
        // //  pdf.addImage(imgDataA, 'JPEG', 6, 6, 297, 0);
        // pdf.addImage(pdfImageAs[2], 'JPEG', 6, 6, 285, 198);
        // pdf.addPage();
        // pdf.setPage(4);
        // pdf.addImage(pdfImageBs[2], 'JPEG', 6, 6, 285, 198);

        if(i != pdfImageAs.length - 1)
            pdf.addPage();
    }
/*    pdf.setPage(1);
  //  pdf.addImage(imgDataA, 'JPEG', 6, 6, 297, 0);
    pdf.addImage(imgDataA, 'JPEG', 6, 6, 285, 198,'','FAST');
    pdf.addPage();
    pdf.setPage(2);
    pdf.addImage(imgDataB, 'JPEG', 6, 6, 285, 198);*/
    //pdf.addImage(imgDataB, 'JPEG', 6, 6, 285, 189,'','FAST');
    var delayInMilliseconds = 0; //1 second

    setTimeout(function() {
        zip.folder(folderName).file(csvFileName.split(".")[0] + "_app.pdf", pdf.output(), {binary:true});
    
        var newCsvFileName = csvFileName.split(".")[0] + "_app." + csvFileName.split(".")[1];

        var csvString = Papa.unparse(data.data);
        var csvString = "\ufeff" + csvString;

        var blob = new Blob([csvString], { type: ' type: "text/csv;charset=UTF-8"' });//Here, I also tried charset=GBK , and it does not work either
        //var csvUrl = createObjectURL(blob);

        zip.folder(folderName).file(newCsvFileName, blob);//Papa.unparse(data.data));
        
        zip.generateAsync({ type: "blob" }).then(function (blob) {
            saveAs(blob, csvFileName.split(".")[0] + "_app" + ".zip");
        });
    }, delayInMilliseconds);
    
    return false;
}

function addPages(rowNum, aCanvas, isACard){
    var imgData = aCanvas.toDataURL("image/jpeg", 0.01);
    var pageNum = Math.floor(rowNum / 4) + 1;

    
    if (isACard){
        pdfImageAs[pageNum] = imgData;
    }
    else{
        pdfImageBs[pageNum] = imgData;
    }
}

function handleSelectedFile(eventTargetFiles) {
    if (eventTargetFiles.length > 0) {
        //var thisEvent = event;
        reset();
        document.getElementById('dataFilesInputLabel').innerHTML = eventTargetFiles.length + ' Files';
        fileList = eventTargetFiles;
        document.getElementById('invalidMessages').innerHTML = '';
        document.getElementById("errorlabel").style.display = "none";

        for (var i = 0; i < fileList.length; i++) {
            var fileListItem = fileList[i];
            var winfilename= fileListItem.name;
     //       console.log("========handleSelectedFile======= "+ winfilename.toString())
        }

        //console.log("===" + fileList);
        generateCards();
    }
}
String.prototype.replaceAt = function(index, replacement) {
    console.log("===sssindex = = " + index + "== " + replacement);
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}
function generateCards() {
    formData = document.forms['cardForm'];
    //folderName = formData['folderNameField'].value;
    for (var i = 0; i < fileList.length; i++) {
        if (fileList[i].name.endsWith('.csv')) {
            csvFileName = fileList[i].name;
            var reader = new FileReader();
            var csvFile = fileList[i];
            reader.onload = function (e) {
                var codes = new Uint8Array(e.target.result);
                var encoding = Encoding.detect(codes);
                var unicodeString = Encoding.convert(codes, {
                    to: 'Unicode',
                    from: encoding,
                    type: 'string'
                });
                // Edit on 2020.9.15
                var encoding1 = Encoding.detect(unicodeString);
                var unicodeString1 = Encoding.convert(unicodeString, {
                    to: 'Windows-1256',
                    from: encoding1,
                    type: 'string'
                });
                for(let i = 0; i < codes.length; i++){ 
                    //console.log("=== = = " + codes[i]);
                    if (codes[i] == 180){// if Arabic " ' "
                        unicodeString = unicodeString.replaceAt(i, unicodeString1[i]);
                    }
                }
                ////////////
                Papa.parse(unicodeString, {
                    header: true,
                    dynamicTyping: false,
                    skipEmptyLines: true,
                    complete: function (results) {
                        console.log("RESULTS:\n " + JSON.stringify(results));
                        data = results;
                        loadBar = new ProgressBar(data.data.length, "loadBar", "loadBarLabel", function () {
                            onComplete()
                        });
                        selectFieldOnCSV(fileList);
                        // makeCsvTable(fileList);
                    }
                });
            }
            reader.readAsArrayBuffer(csvFile);
        } else {
            //zip.folder(folderName).file(fileList[i].name.toString(), fileList[i]);
        }
    }
}

function showPreview(index) {
    if (!!cardUrls[index]) document.getElementById("cardPreviewA").innerHTML = '<img id="cardAPreviewImage" src="' + cardUrls[index] + '"/>';
    scrollToElement("cardPreviewA");
    if (!!cardUrlsB[index]) document.getElementById("cardPreviewB").innerHTML = '<img id="cardBPreviewImage" src="' + cardUrlsB[index] + '"/>';
    scrollToElement("cardPreviewB");
}

function isValidateCSV(){
    var metaDataCheck = data.meta.fields;
    var resultsDataCheck = data.data;
    if (!isStringInCategory(metaDataCheck[0], "Num_ID"))
        return "Num_ID Error";
    if (!isStringInCategory(metaDataCheck[1], "QR_Code_Image_file"))
        return "QR_Code_Image_file Error";
    for (var columnHeader in metaDataCheck){
    //    console.log("selectFieldOnCSV  ===  " + columnHeader, metaDataCheck[columnHeader]);
        if (!isStringInCategory(metaDataCheck[columnHeader], 'Num_ID') && !isStringInCategory(metaDataCheck[columnHeader], 'QR_Code_Image_file') && !isStringInCategory(metaDataCheck[columnHeader], 'field') && !isStringInCategory(metaDataCheck[columnHeader], 'image') && !isStringInCategory(metaDataCheck[columnHeader], 'audio'))
            return "Header Name error!";
    }
    for (var key in resultsDataCheck) {
        if (resultsDataCheck.hasOwnProperty(key)) {
            for (var value in resultsDataCheck[key]) {
     //           console.log("resultsDataCheck == " + key + " ===  " + value + "- " + resultsDataCheck[key][value].toString(),resultsDataCheck[key][value].toString() == "");
                if (isStringInCategory(value, 'Num_ID')){
                    if (resultsDataCheck[key][value].toString() != "")
                        return "Num_ID Error ! Delete Num_ID in row " + (parseInt(key) + 2).toString();
                }
                else if (isStringInCategory(value, 'QR_Code_Image_file')){
                    if (resultsDataCheck[key][value].toString() != "")
                        return "QR_Code_Image_file Error ! Delete QR_Code_Image_file in row " + (parseInt(key) + 2).toString();
                }
                else if (isStringInCategory(value, 'image')){
                    if (resultsDataCheck[key][value].toString() != "" && !resultsDataCheck[key][value].toString().includes('.png') && !resultsDataCheck[key][value].toString().includes('.jpg') && !resultsDataCheck[key][value].toString().includes('.jpeg'))
                        return "Image Info Error! Header = " + value + " Row = " + (parseInt(key) + 2).toString();
                }
                else if (isStringInCategory(value, 'audio')){
                    if (resultsDataCheck[key][value].toString() != "" && !resultsDataCheck[key][value].toString().includes('.mp3')){
						var temp = key + 2;
                        return "Audio Info Error! Header = " + value + " Row = " + (parseInt(key) + 2).toString();
					}
                }
                else if (isStringInCategory(value, 'field')){

                }
            }
        }
    }
    return "";
}

function selectFieldOnCSV(fileList) {
    //console.log("test ===    " + isValidateCSV());
    var errorResult = isValidateCSV();
    if (errorResult != ""){
        document.getElementById("errorlabel").style.display = "contents";
        document.getElementById('invalidMessages').insertAdjacentHTML('beforeend', "File : " + csvFileName + ":   \n " + errorResult);
    //    console.log("error! " + csvFileName + "\n " + errorResult);
        alert("Error! Please repair CSV File " + csvFileName + "\n " + errorResult);
        
        return;
    }
    $("#divSelectField").show();

    var metaData = data.meta.fields;
    var selectAsString = "";
    var selectAsStringA = "";
    var selectAsStringB = "";
    for (var columnHeader in metaData){
        if (metaData.hasOwnProperty(columnHeader) && !isStringInCategory(metaData[columnHeader], 'qr'))
            selectAsString += "<option value='" + metaData[columnHeader] + "'>" + metaData[columnHeader] + "</option>";
    }
    $("#select_fileds")
        .empty()
        .append(selectAsString);
    $("#select_fileds").selectpicker("refresh");

    for (var columnHeader in metaData)
        
        if (metaData.hasOwnProperty(columnHeader) && !isStringInCategory(metaData[columnHeader], 'qr')
         && isStringInCategory(metaData[columnHeader], 'image'))
         {
            console.log(metaData[columnHeader]);
            selectAsStringA += "<option value='" + metaData[columnHeader] + "'>" + metaData[columnHeader] + "</option>";
         }
    $("#select_filedsA")
        .empty()
        .append(selectAsStringA);
    $("#select_filedsA").selectpicker("refresh");
    for (var columnHeader in metaData)
        
    if (metaData.hasOwnProperty(columnHeader) && !isStringInCategory(metaData[columnHeader], 'qr')
        && isStringInCategory(metaData[columnHeader], 'field'))
        {
            console.log(metaData[columnHeader]);
            selectAsStringB += "<option value='" + metaData[columnHeader] + "'>" + metaData[columnHeader] + "</option>";
        }
    $("#select_filedsB")
        .empty()
        .append(selectAsStringB);
    $("#select_filedsB").selectpicker("refresh");
}

function runClick() {
    var columnHeader = $('#select_fileds').val();
    var columnHeaderA = $('#select_filedsA').val();
    var columnHeaderB = $('#select_filedsB').val();
    if (columnHeader.length === 0) {
        alert("Please select column headers first that you want.");
    }else if(columnHeaderA.length === 0){
        alert("Please select column headers first that you want.");
    }else if(columnHeaderB.length === 0){
        alert("Please select column headers first that you want.");
    }else {
        
        if (!columnHeader.includes("Num_ID")){
            columnHeader = "Num_ID," + columnHeader;
        }
        makeCsvTable(columnHeader, columnHeaderA, columnHeaderB);
    }
}

function makeCsvTable(columnHeader, columnHeaderA, columnHeaderB) {
    var metaData = data.meta.fields;
    var resultsData = data.data;
    var totalResults = resultsData.length;
    var randIntArray = getArrayOfRandomIntegers(resultsData.length, formData['digitsField'].value);
    var tableHtml = ['<table id="dataTable" class="tables">' + searchInputHtml + '<tr>'];
    var counter = 0;

    for (var aHeader in metaData)
        if ((metaData.hasOwnProperty(aHeader) && columnHeader.indexOf(metaData[aHeader]) !== -1) || (metaData.hasOwnProperty(aHeader) && isStringInCategory(metaData[aHeader], 'qr')))
            tableHtml.push('<th>' + metaData[aHeader] + '</th>');
    tableHtml.push('</tr>');
    
    
    //document.getElementById("cardACanvasPreviewDiv").innerHTML = '<canvas id="cardACanvasPreview" style="display: none; border: 1px solid #d3d3d3;"> + Your browser does not support the HTML5 canvas tag. </canvas>';
    //canvas = document.getElementById("cardACanvasPreview");

    //document.getElementById("cardBCanvasPreviewDiv").innerHTML = '<canvas id="cardBCanvasPreview" style="display: none; border: 1px solid #d3d3d3;"> + Your browser does not support the HTML5 canvas tag. </canvas>';
    //canvasB = document.getElementById("cardBCanvasPreview");
    csvRowCount = resultsData.length;
    for (var key in resultsData) {
        if (resultsData.hasOwnProperty(key)) {
            console.log("Length: " + totalResults + "\n");
            tableHtml.push('<tr class="visible-rows" onclick="showPreview(this.rowIndex-1)">');
            for (var value in resultsData[key]) {
                if ((resultsData[key].hasOwnProperty(value) && columnHeader.indexOf(value) !== -1) || (resultsData[key].hasOwnProperty(value) && isStringInCategory(value, 'qr'))) {
                    var tableDataHtml = '<td';
                    if (isStringInCategory(value, 'id'))
                        resultsData[key][value] = randIntArray[counter];
                    if (isStringInCategory(value, 'qr'))
                        tableDataHtml += ' id="qrItemForRowAt' + counter + '"';
                    tableDataHtml += '>' + dataAsHtml(resultsData[key][value]);
                    if (isStringInCategory(value, 'audio'))
                        tableDataHtml += '<button type="button" onclick="toggleAudio(this.rowIndex-1, this.cellIndex)">Play</button>';
                    tableDataHtml += '</td>';
                    tableHtml.push(tableDataHtml);
                    //tableHtml.push('<td' + (isStringInCategory(resultsData[i][value], 'qr') ? ' id="qrItemForRowAt' + i + '"' : '') + '>' + dataAsHtml(resultsData[i][value].toString()) + '</td>');
                }
            }
            tableHtml.push('</tr>');
            

            //for (var i = 0; i < 100000000; i++){}
        }
        counter++;
    }

    var ii = 0
    complateACard = true;
    var refreshId = setInterval( function() 
    {

        if(ii >= counter)
            return;
        //if(complateACard)
        //{
            makeCardA(ii);
            makeCardB(ii);
            ii++;
        //}
        
    }, 1000);
    
    
    tableHtml.push('</table>');
    document.getElementById("tableDiv").innerHTML = tableHtml.join('');

    function dataAsHtml(fileName) {
        if (!!fileName) {
            var fileString = getExistingImageFile(fileName);
            if (fileString !== null && fileString.length > 0)
                return '<img src="' + fileString + '"/>';
            return fileName.toString();
        }
        return '';
    }

    document.getElementById("cardPreviewA").innerHTML = '';
    document.getElementById("cardPreviewB").innerHTML = '';
    loadBar.update();

}

function makeCardA(row) {
    var rowData = new stringDataAtRow(row);
    var indexOfLastImage = getIndexOfLastImage();
    var CARD_DIMENSION_MULTIPLE = 100.0;
    
    if (row % 4 == 0){
        //canvas = document.getElementById("cardAPreviewImage");
        var canvasName = "cardACanvasPreview" + Math.floor(row/4);
        
        document.getElementById("cardACanvasPreviewDiv").innerHTML += '<canvas id="' + canvasName + '" style="display: none; border: 1px solid #d3d3d3;"> + Your browser does not support the HTML5 canvas tag. </canvas>';
        var canvas = document.getElementById(canvasName);

        canvas.width = 2 * CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE;
        canvas.height = 2 * CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE;
        var context = canvas.getContext("2d");
        context.beginPath();
        //context.clearRect(0, 0, canvas.width, canvas.height);

        setDPI(canvas, 500);
        context.font = "15pt Arial";
        context.fontcolor = "black";
        context.beginPath();
        context.rect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = "white";
        context.fill();
        
        context.fillStyle = "black";
        context.setLineDash([Math.floor(CARD_DIMENSION_MULTIPLE / 24.75), Math.floor(CARD_DIMENSION_MULTIPLE / 24.75)]);
        context.beginPath();
        context.moveTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        context.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        context.moveTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        context.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        context.moveTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        context.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        context.moveTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        context.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        context.moveTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        context.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        context.moveTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        context.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        
        context.moveTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        context.lineTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        context.moveTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        context.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        context.stroke();
    }

   // var lineHeight = parseInt(context.font);
 /*   drawTextSection(rowData.names,
        CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
        CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE);

    drawTextSection(rowData.authors,
        CARD_MEASUREMENTS.CARD_BACK.AUTHOR_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.AUTHOR_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE - lineHeight,
        CARD_MEASUREMENTS.CARD_BACK.AUTHOR_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.AUTHOR_SECTION_Y() * CARD_DIMENSION_MULTIPLE);

    drawTextSection(rowData.dateAndCopyright,
        CARD_MEASUREMENTS.CARD_BACK.AUTHOR_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, lineHeight,
        CARD_MEASUREMENTS.CARD_BACK.AUTHOR_SECTION_X() * CARD_DIMENSION_MULTIPLE, (CARD_MEASUREMENTS.CARD_BACK.AUTHOR_SECTION_Y() + CARD_MEASUREMENTS.CARD_BACK.AUTHOR_SECTION_HEIGHT) * CARD_DIMENSION_MULTIPLE - lineHeight);

    
    drawTextSection(rowData.numId,
        CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE,
        CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE);
*/
//console.log("1=== " + row + " -- " + indexOfLastImage);
    if (row % 4 == 0)
    {
        
        if (indexOfLastImage > -1) {
            
            drawImageSection(rowData.imageAList[0], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_WIDTH * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_Y() * 
                CARD_DIMENSION_MULTIPLE, isLastImage(0));
            if (indexOfLastImage == 0)
                return;
            drawImageSection(rowData.imageAList[1], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_Y() * 
                CARD_DIMENSION_MULTIPLE, isLastImage(1));
            if (indexOfLastImage == 1)
                return;
            drawImageSection(rowData.imageAList[2], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_HEIGHT * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_Y() * CARD_DIMENSION_MULTIPLE, isLastImage(2));

            if (indexOfLastImage == 2)
                return;
            drawImageSection(rowData.imageAList[3], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_HEIGHT * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_Y() * CARD_DIMENSION_MULTIPLE, isLastImage(3));
            
            if (indexOfLastImage == 3)
                return;
            drawImageSection(rowData.imageAList[4], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_HEIGHT * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_Y() * CARD_DIMENSION_MULTIPLE, isLastImage(4));
            
            
        } else {
            drawQrSection(rowData.rowAsString,
                CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_Y() * CARD_DIMENSION_MULTIPLE, true, function () {
                    var delayInMilliseconds = 0; //1 second

                    setTimeout(function() {
                        if (csvRowCount == row + 1){
                            addPages(row, canvas, true);
                            canvas.toBlob(function (blob) {
                                //zip.folder(folderName).file("cardA" + Math.floor(row / 4) + ".png", blob);
                                //if (Math.floor(row / 4) == 0){
                                    cardUrls[row] = URL.createObjectURL(blob).toString();
                                    //show preview of first row
                                    document.getElementById("cardPreviewA").innerHTML = '<img id="cardAPreviewImage" src="' + cardUrls[row] + '"/>';
                                //}

                                
                            });
                        }
                        loadBar.update();
                    }, delayInMilliseconds);
                    
                        
                });
        }
    }
    else if (row % 4 == 1){
        if (indexOfLastImage > -1) {
            drawImageSection(rowData.imageAList[0], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_WIDTH * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_Y() * 
                CARD_DIMENSION_MULTIPLE, isLastImage(0));
            
            if (indexOfLastImage == 0)
                return;
            drawImageSection(rowData.imageAList[1], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_Y() * 
                CARD_DIMENSION_MULTIPLE, isLastImage(1));

            if (indexOfLastImage == 1)
                return;
            drawImageSection(rowData.imageAList[2], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_Y() * CARD_DIMENSION_MULTIPLE, isLastImage(2));

            if (indexOfLastImage == 2)
                return;
            drawImageSection(rowData.imageAList[3], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_Y() * CARD_DIMENSION_MULTIPLE, isLastImage(3));
                
            if (indexOfLastImage == 3)
                return;
            drawImageSection(rowData.imageAList[4], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_Y() * CARD_DIMENSION_MULTIPLE, isLastImage(4));
            
        } else {
            drawQrSection(rowData.rowAsString,
                CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_Y() * CARD_DIMENSION_MULTIPLE, true, function () {
                    var delayInMilliseconds = 0; //1 second

                    setTimeout(function() {
                        if (csvRowCount == row + 1){
                            addPages(row, canvas, true);
                            canvas.toBlob(function (blob) {
                                //zip.folder(folderName).file("cardA" + Math.floor(row / 4) + ".png", blob);
                                //if (Math.floor(row / 4) == 0){
                                    cardUrls[row] = URL.createObjectURL(blob).toString();
                                    //show preview of first row
                                    document.getElementById("cardPreviewA").innerHTML = '<img id="cardAPreviewImage" src="' + cardUrls[row] + '"/>';
                               // }
                                
                            });
                        }
                        loadBar.update();
                    }, delayInMilliseconds);
                    
                        
                });
        }
    }
    else if (row % 4 == 2){
        if (indexOfLastImage > -1) {
            drawImageSection(rowData.imageAList[0], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_WIDTH * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_X() * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(0));

            if (indexOfLastImage == 0)
                return;
            drawImageSection(rowData.imageAList[1], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_X() * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(1));

            if (indexOfLastImage == 1)
                return;
            drawImageSection(rowData.imageAList[2], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_X() * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(2));

            if (indexOfLastImage == 2)
                return;
            drawImageSection(rowData.imageAList[3], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_X() * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(3));
                
            if (indexOfLastImage == 3)
                return;
            drawImageSection(rowData.imageAList[4], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_X() * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(4));
            
        } else {
            drawQrSection(rowData.rowAsString,
                CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, true, function () {
                    var delayInMilliseconds = 0; //1 second

                    setTimeout(function() {
                        if (csvRowCount == row + 1){
                            addPages(row, canvas, true);
                            canvas.toBlob(function (blob) {
                                //zip.folder(folderName).file("cardA" + Math.floor(row / 4) + ".png", blob);
                                //if (Math.floor(row / 4) == 0){
                                    cardUrls[row] = URL.createObjectURL(blob).toString();
                                    //show preview of first row
                                    document.getElementById("cardPreviewA").innerHTML = '<img id="cardAPreviewImage" src="' + cardUrls[row] + '"/>';
                               // }
                                // context.clearRect(0, 0, canvas.width, canvas.height);
                            });
                        }
                        
                        loadBar.update();
                    }, delayInMilliseconds);
                    
                        
                    
                });
        }
    }
    else if (row % 4 == 3){
        complateACard = false;
        if (indexOfLastImage > -1) {
            drawImageSection(rowData.imageAList[0], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_WIDTH * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_ONE_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(0));

            if (indexOfLastImage == 0)
                return;
            drawImageSection(rowData.imageAList[1], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_TWO_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(1));

            if (indexOfLastImage == 1)
                return;
            drawImageSection(rowData.imageAList[2], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_THREE_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(2));

            if (indexOfLastImage == 2)
                return;
            drawImageSection(rowData.imageAList[3], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FOUR_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(3));
                
            if (indexOfLastImage == 3)
                return;
            drawImageSection(rowData.imageAList[4], CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_HEIGHT * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, 
                CARD_MEASUREMENTS.CARD_FRONT.IMAGE_FIVE_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, isLastImage(4));
            
        } else {
            drawQrSection(rowData.rowAsString,
                CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, true, function () {
                    var delayInMilliseconds = 0; //1 second

                    setTimeout(function() {
                        addPages(row, canvas, true);
                        canvas.toBlob(function (blob) {
                            //zip.folder(folderName).file("cardA" + Math.floor(row / 4) + ".png", blob);
                           // if (Math.floor(row / 4) == 0){
                                cardUrls[row] = URL.createObjectURL(blob).toString();
                                //show preview of first row
                                document.getElementById("cardPreviewA").innerHTML = '<img id="cardAPreviewImage" src="' + cardUrls[row] + '"/>';
                           // }
                            // context.clearRect(0, 0, canvas.width, canvas.height);
                        });
                        loadBar.update();
                    }, delayInMilliseconds);
                   
                });
        }
    }

    function isLastImage(index) {
        if (index == indexOfLastImage)
            return true;
        return false;
    }

    function getIndexOfLastImage() {
        var lastIndex = -1;
        for (var i = 0; i < rowData.imageAList.length; i++){
            
            if (rowData.imageAList[i] !== null && rowData.imageAList[i] !== "" && rowData.imageAList[i].length > 0)
                lastIndex = i;
        }
        return lastIndex;
    }

    

    function setDPI(canvas, dpi) {
        if (!canvas.style.width)
            canvas.style.width = canvas.width + 'px';
        if (!canvas.style.height)
            canvas.style.height = canvas.height + 'px';
        var scaleFactor = dpi / 96;
        canvas.width = Math.ceil(canvas.width * scaleFactor);
        canvas.height = Math.ceil(canvas.height * scaleFactor);
        var ctx = canvas.getContext('2d');
        ctx.scale(scaleFactor, scaleFactor);
    }

    function drawQrSection(qrValue, width, height, x, y, frontAndBack, callback) {
        var canvasName = "cardACanvasPreview" + Math.floor(row/4);
        canvas = document.getElementById(canvasName);
        var context = canvas.getContext("2d");

        if (!!qrValue && qrValue.length > 0) {
            frontAndBack = true;
            var qrImg = new VanillaQR({
                url: qrValue.toString(),
                width: width * 100,
                height: height * 100,
                noBorder: true
            }).toImage("png");


            qrImg.onload = function () {
                var cardPreviewQrCodeCanvas = document.getElementById("cardPreviewQrCode");
                cardPreviewQrCodeCanvas.innerHTML = '<canvas id="qrCanvas"' + 'width=' + width + 'height=' + height + '></canvas>';
                var qrCanvas = document.getElementById("qrCanvas");
                qrCanvas.height = qrCanvas.width;
                var qrContext = qrCanvas.getContext("2d");
                setDPI(qrCanvas, 500);
                qrContext.beginPath();
                qrContext.drawImage(qrImg, 0, 0, width, width);
                qrCanvas.toBlob(function (blob) {
                    var qrFileName = "qr_" + rowData.primaryName.toLowerCase() + "_" + rowData.numId + ".png";
                    zip.folder(folderName).file(qrFileName, blob);
                    document.getElementById("qrItemForRowAt" + row).innerHTML = '<img src="' + URL.createObjectURL(blob) + '"/>';
                //    console.log("2=== " + qrFileName + " -- " + row);
                    data.data[row][rowData.qrHeaderName] = qrFileName;
                    cardPreviewQrCodeCanvas.innerHTML = '';

                    context.beginPath();
                    context.drawImage(qrImg, x, y, width, height);
                    context.setLineDash([Math.floor(CARD_DIMENSION_MULTIPLE / 24.75), 0]);
                    context.strokeStyle = "white";
                    context.lineWidth = CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE;
                    context.strokeRect(x - CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE / 2, y - CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE / 2, width + CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE, height + CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE);
                    

                    callback();
                });
                
            };
        }
    }

    function drawTextSection(text, width, height, x, y) {
        //var lineHeight = parseInt(context.font);
        var words = text.split(' '), lines = [], line = "";
        if (context.measureText(text).width < width)
            lines = [text];
        else while (words.length > 0) {
            var split = false;
            while (context.measureText(words[0]).width >= width) {
                var tmp = words[0];
                words[0] = tmp.slice(0, -1);
                if (!split) {
                    split = true;
                    words.splice(1, 0, tmp.slice(-1));
                } else {
                    words[1] = tmp.slice(-1) + words[1];
                }
            }
            if (context.measureText(line + words[0]).width < width) {
                line += words.shift() + " ";
            } else {
                lines.push(line);
                line = "";
            }
            if (words.length === 0)
                lines.push(line);
        }
        lines = lines.slice(0, Math.floor(height / lineHeight));
        for (var i = 0; i < lines.length; i++) {
            context.fillText(lines[i], x, lineHeight * (i + 1) + y);
        }
    }

    function getTextArray(text, width) {

    }

    function drawImageSection(img, width, height, x, y, lastImage) {
        var itemImg = new Image();
        itemImg.src = img;

        var canvasName = "cardACanvasPreview" + Math.floor(row/4);
        canvas = document.getElementById(canvasName);
        var context = canvas.getContext("2d");

        itemImg.onload = function () {
            context.drawImage(itemImg, x, y, width, height);
            if (lastImage) {
                if (row % 4 == 0){
                    drawQrSection(rowData.rowAsString,
                        CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                        CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_Y() * CARD_DIMENSION_MULTIPLE, true, function () {
                            var delayInMilliseconds = 0; //1 second

                            setTimeout(function() {
                                if (csvRowCount == row + 1){
                                    addPages(row, canvas, true);
                                    canvas.toBlob(function (blob) {
                                        //zip.folder(folderName).file("cardA" + Math.floor(row / 4) + ".png", blob);
                                       // if (Math.floor(row / 4) == 0){
                                            cardUrls[row] = URL.createObjectURL(blob).toString();
                                        //show preview of first row
                                            document.getElementById("cardPreviewA").innerHTML = '<img id="cardAPreviewImage" src="' + cardUrls[row] + '"/>';
                                       // }
                                        // context.clearRect(0, 0, canvas.width, canvas.height);
                                       
                                    });
                                    
                                }

                                
                                loadBar.update();
                            }, delayInMilliseconds);
                            
                                
                        });
                }
                else if (row % 4 == 1){
                    drawQrSection(rowData.rowAsString,
                        CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                        CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_Y() * CARD_DIMENSION_MULTIPLE, true, function () {
                            var delayInMilliseconds = 0; //1 second

                            setTimeout(function() {
                                if (csvRowCount == row + 1){
                                    addPages(row, canvas, true);
                                    canvas.toBlob(function (blob) {
                                        //zip.folder(folderName).file("cardA" + Math.floor(row / 4) + ".png", blob);
                                        
                                      //  if (Math.floor(row / 4) == 0){
                                            cardUrls[row] = URL.createObjectURL(blob).toString();
                                        //show preview of first row
                                            document.getElementById("cardPreviewA").innerHTML = '<img id="cardAPreviewImage" src="' + cardUrls[row] + '"/>';
                                      //  }
                                        // context.clearRect(0, 0, canvas.width, canvas.height);
                                    });
                                }
                                loadBar.update();
                            }, delayInMilliseconds);
                            
                                
                        });
                }
                else if (row % 4 == 2){
                    drawQrSection(rowData.rowAsString,
                        CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                        CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, true, function () {
                            var delayInMilliseconds = 0; //1 second

                            setTimeout(function() {
                                if (csvRowCount == row + 1){
                                    addPages(row, canvas, true);
                                    canvas.toBlob(function (blob) {
                                        //zip.folder(folderName).file("cardA" + Math.floor(row / 4) + ".png", blob);
                                      //  if (Math.floor(row / 4) == 0){
                                            cardUrls[row] = URL.createObjectURL(blob).toString();
                                            //show preview of first row
                                            document.getElementById("cardPreviewA").innerHTML = '<img id="cardAPreviewImage" src="' + cardUrls[row] + '"/>';
                                       // }
                                        // context.clearRect(0, 0, canvas.width, canvas.height);
                                    });
                                }
                                loadBar.update();
                            }, delayInMilliseconds);
                            
                            
                            
                                
                            
                        });
                }
                else if (row % 4 == 3){
                    drawQrSection(rowData.rowAsString,
                        CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                        CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, true, function () {
                            var delayInMilliseconds = 0; //1 second
                            
                            setTimeout(function() {
                                
                                addPages(row, canvas, true);
                                canvas.toBlob(function (blob) {
                                    //zip.folder(folderName).file("cardA" + Math.floor(row / 4) + ".png", blob);
                                    
                                    //show preview of first row
                                 //   if (Math.floor(row / 4) == 0){
                                        cardUrls[row] = URL.createObjectURL(blob).toString();
                                        document.getElementById("cardPreviewA").innerHTML = '<img id="cardAPreviewImage" src="' + cardUrls[row] + '"/>';
                                  //  }
                                
                                    // context.clearRect(0, 0, canvas.width, canvas.height);
                                    complateACard = true;
                                });
                                loadBar.update();
                            }, delayInMilliseconds);
                            
                            
                        });
                }
            }
        };
    }
}
function makeCardB(row) {
    
    var rowData = new stringDataAtRow(row);
    //var indexOfLastImage = getIndexOfLastImage();
    var CARD_DIMENSION_MULTIPLE = 100.0;
    if (row % 4 == 0){
        var canvasName = "cardBCanvasPreview" + Math.floor(row/4);
        document.getElementById("cardBCanvasPreviewDiv").innerHTML += '<canvas id="' + canvasName + '" style="display: none; border: 1px solid #d3d3d3;"> + Your browser does not support the HTML5 canvas tag. </canvas>';
        var canvasB = document.getElementById(canvasName);
    
        canvasB.width = 2 * CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE;
        canvasB.height = 2 * CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE;
        var contextB = canvasB.getContext("2d");

        setDPI(canvasB, 500);
        contextB.font = "40pt Arial";
        contextB.fontcolor = "black";
        contextB.beginPath();
        contextB.rect(0, 0, canvasB.width, canvasB.height);
        contextB.fillStyle = "white";
        contextB.fill();
        contextB.fillStyle = "black";
        contextB.setLineDash([Math.floor(CARD_DIMENSION_MULTIPLE / 24.75), Math.floor(CARD_DIMENSION_MULTIPLE / 24.75)]);
        contextB.beginPath();
        contextB.moveTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        contextB.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        contextB.moveTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        contextB.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        contextB.moveTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        contextB.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        contextB.moveTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        contextB.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE);
        contextB.moveTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        contextB.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        contextB.moveTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        contextB.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        
        contextB.moveTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        contextB.lineTo(CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        contextB.moveTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        contextB.lineTo(CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE);
        contextB.stroke();
    }    
    
                            

    var lineHeight = 40;
    var groupNum = Math.floor(row / 4) * 4;
    //console.log("=== " + groupNum);
    if (row % 4 == 0)
    {
        if (csvRowCount == row + 1){
            var rowData0 = new stringDataAtRow(groupNum + 0);
            drawTextSection(rowData0.textBString,
                CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 38);
            drawTextSection(rowData0.numId,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 24);
            
        }
        drawQrSection(rowData.rowAsString,
            CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, 
            CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE, 
            true, function () {
                var delayInMilliseconds = 0; //1 second

                setTimeout(function() {
                    if (csvRowCount == row + 1){
                        addPages(row, canvasB, false);
                        canvasB.toBlob(function (blob) { 
                            //zip.folder(folderName).file("cardB" + Math.floor(row/4) + ".png", blob);
                            cardUrlsB[row] = URL.createObjectURL(blob).toString();
                            document.getElementById("cardPreviewB").innerHTML = '<img id="cardBPreviewImage" src="' + cardUrlsB[row] + '"/>';
                            
            
                            
                        //    loadBar.update();
                            
                        });
                    }
                }, delayInMilliseconds);
                
            });   
            
    }
    else if (row % 4 == 1)
    {
        if (csvRowCount == row + 1){
            var rowData0 = new stringDataAtRow(groupNum + 0);
            drawTextSection(rowData0.textBString,
                CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 38);
            drawTextSection(rowData0.numId,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 24);
            
            var rowData1 = new stringDataAtRow(groupNum + 1);
            drawTextSection(rowData1.textBString,
                CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 38);
            drawTextSection(rowData1.numId,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 24);
        
        }
        drawQrSection(rowData.rowAsString,
            CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE, 
            CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE, 
            true, function () {
                var delayInMilliseconds = 0; //1 second

                setTimeout(function() {
                    if (csvRowCount == row + 1){
                        addPages(row, canvasB, false);
                        canvasB.toBlob(function (blob) { 
                            //zip.folder(folderName).file("cardB" + Math.floor(row/4) + ".png", blob);
                            cardUrlsB[row] = URL.createObjectURL(blob).toString();
                            console.log("Test === " + cardUrlsB[1]);
                            if (cardUrlsB[1] != undefined)
                                document.getElementById("cardPreviewB").innerHTML = '<img id="cardBPreviewImage" src="' + cardUrlsB[1] + '"/>';
                            
                            
            
                            
                        //    loadBar.update();
                            
                        });
                    }
                }, delayInMilliseconds);
                
            });
         
    }
    else if (row % 4 == 2)
    {
        if (csvRowCount == row + 1){
            var rowData0 = new stringDataAtRow(groupNum + 0);
            drawTextSection(rowData0.textBString,
                CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 38);
            drawTextSection(rowData0.numId,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 24);
            
            var rowData1 = new stringDataAtRow(groupNum + 1);
            drawTextSection(rowData1.textBString,
                CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 38);
            drawTextSection(rowData1.numId,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 24);
        
            var rowData2 = new stringDataAtRow(groupNum + 2);
            drawTextSection(rowData2.textBString,
                CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, 38);
            drawTextSection(rowData2.numId,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
                CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, 24);
        
        }
        
        drawQrSection(rowData.rowAsString,
            CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, 
            CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, 
            true, function () {
                var delayInMilliseconds = 0; //1 second

                setTimeout(function() {
                    if (csvRowCount == row + 1){
                        addPages(row, canvasB, false);
                        canvasB.toBlob(function (blob) { 
                            //zip.folder(folderName).file("cardB" + Math.floor(row/4) + ".png", blob);
                            cardUrlsB[row] = URL.createObjectURL(blob).toString();
                            document.getElementById("cardPreviewB").innerHTML = '<img id="cardBPreviewImage" src="' + cardUrlsB[2] + '"/>';
                            
            
                            
                        //    loadBar.update();
                            
                        });
                    }
                }, delayInMilliseconds);
                
            });    
    }
    else if (row % 4 == 3)
    {
        var rowData0 = new stringDataAtRow(groupNum + 0);
        drawTextSection(rowData0.textBString,
            CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 38);
        drawTextSection(rowData0.numId,
            CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 24);
        
        var rowData1 = new stringDataAtRow(groupNum + 1);
        drawTextSection(rowData1.textBString,
            CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 38);
        drawTextSection(rowData1.numId,
            CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE, 24);
    
        var rowData2 = new stringDataAtRow(groupNum + 2);
        drawTextSection(rowData2.textBString,
            CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, 38);
        drawTextSection(rowData2.numId,
            CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, 24);
    
        drawTextSection(rowData.textBString,
            CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN  * CARD_DIMENSION_MULTIPLE * 2 - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NAME_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, 38);
        drawTextSection(rowData.numId,
            CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_WIDTH * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_HEIGHT * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_X() * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.NUMERICAL_ID_SECTION_Y() * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, 24);
        
        
        drawQrSection(rowData.rowAsString,
            CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE, CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE,
            CARD_MEASUREMENTS.CARD_WIDTH * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE, 
            CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.CARD_HEIGHT * CARD_DIMENSION_MULTIPLE, 
            true, function () {
                var delayInMilliseconds = 0; //1 second

                setTimeout(function() {
                    addPages(row, canvasB, false);
                    canvasB.toBlob(function (blob) { 
                        //zip.folder(folderName).file("cardB" + Math.floor(row/4) + ".png", blob);
                        cardUrlsB[row] = URL.createObjectURL(blob).toString();
                        document.getElementById("cardPreviewB").innerHTML = '<img id="cardBPreviewImage" src="' + cardUrlsB[3] + '"/>';
                        

                        
                    //    loadBar.update();
                        
                    });
                }, delayInMilliseconds);
            
            
            });    
    }
    // if (csvRowCount == row + 1){
    //     document.forms['cardForm']['submitButton'].disabled = false;
    // }

    

    
    function setDPI(canvasB, dpi) {
        if (!canvasB.style.width)
            canvasB.style.width = canvasB.width + 'px';
        if (!canvasB.style.height)
            canvasB.style.height = canvasB.height + 'px';
        var scaleFactor = dpi / 96;
        canvasB.width = Math.ceil(canvasB.width * scaleFactor);
        canvasB.height = Math.ceil(canvasB.height * scaleFactor);
        var ctx = canvasB.getContext('2d');
        ctx.scale(scaleFactor, scaleFactor);
    }
    function drawTextSection(text, width, height, x, y, defaultFont) {
        var canvasName = "cardBCanvasPreview" + Math.floor(row/4);
        canvasB = document.getElementById(canvasName);
        var contextB = canvasB.getContext("2d");

        contextB.font = defaultFont + "pt Arial";
        lineHeight = parseInt(contextB.font);
        var words = text.split(''), lines = [], line = "";
        if (contextB.measureText(text).width < width)
            lines = [text];
        else while (words.length > 0) {
            var split = false;
            var fontSize = defaultFont - lines.length * 3;
            contextB.font = fontSize + "pt Arial";
            while (contextB.measureText(words[0]).width >= width) {
                var tmp = words[0];
                words[0] = tmp.slice(0, -1);
                if (!split) {
                    split = true;
                    words.splice(1, 0, tmp.slice(-1));
                } else {
                    words[1] = tmp.slice(-1) + words[1];
                }
            }
            if (lines.length == 6 && contextB.measureText(line).width >= width - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE * 3 / 2){
                line += "......";
                lines.push(line);
                break;
            }

            if (lines.length < 4){
                if (contextB.measureText(line).width + contextB.measureText(words[0]).width * 2 / 3 < width)
                {
                    line += words.shift() + "";
                } else {
                    lines.push(line);
                    line = "";
                }
            }
            else{
                if ((contextB.measureText(line).width + contextB.measureText(words[0]).width / 2) < width - CARD_MEASUREMENTS.CARD_BACK.QR_CODE_SIZE * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE - CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE)
                {
                    line += words.shift() + "";
                } else {
                    lines.push(line);
                    line = "";
                }
                
            }
            if (words.length === 0)
                lines.push(line);
        }
        var lineSpace = 52;
        var linePosY = lineHeight / 2 + CARD_MEASUREMENTS.CARD_MARGIN * CARD_DIMENSION_MULTIPLE + CARD_MEASUREMENTS.PAPER_MAGIN * CARD_DIMENSION_MULTIPLE;
        for (var i = 0; i < lines.length; i++) {
            var fontSize = defaultFont - i * 3;
            contextB.font = fontSize + "pt Arial";
            lineHeight = parseInt(contextB.font);
            
            contextB.fillText(lines[i], x, linePosY + y);
            linePosY += lineSpace;
            lineSpace -= 4;
        }
    }
    function drawQrSection(qrValue, width, height, x, y, frontAndBack, callback) {
        
        var canvasName = "cardBCanvasPreview" + Math.floor(row/4);
        canvasB = document.getElementById(canvasName);
        var contextB = canvasB.getContext("2d");

        if (!!qrValue && qrValue.length > 0) {
            frontAndBack = true;
            var qrImg = new VanillaQR({
                url: qrValue.toString(),
                width: width * 100,
                height: height * 100,
                noBorder: true
            }).toImage("png");


            qrImg.onload = function () {
                var cardPreviewQrCodeCanvas = document.getElementById("cardPreviewQrCode");
                cardPreviewQrCodeCanvas.innerHTML = '<canvas id="qrCanvas"' + 'width=' + width + 'height=' + height + '></canvas>';
                var qrCanvas = document.getElementById("qrCanvas");
                var qrContext = qrCanvas.getContext("2d");
                setDPI(qrCanvas, 500);
                qrContext.drawImage(qrImg, 0, 0, width, height);
                qrCanvas.toBlob(function (blob) {
                    
                    cardPreviewQrCodeCanvas.innerHTML = '';

                    contextB.beginPath();
                    contextB.drawImage(qrImg, x, y, width, height);
                    contextB.setLineDash([Math.floor(CARD_DIMENSION_MULTIPLE / 24.75), 0]);
                    contextB.strokeStyle = "white";
                    contextB.lineWidth = CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE;
                    contextB.strokeRect(x - CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE / 2, y - CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE / 2, width + CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE, height + CARD_MEASUREMENTS.QR_BODER_WIDTH * CARD_DIMENSION_MULTIPLE);
                    

                    callback();
                });
            };
        }
    }
}

function stringDataAtRow(row) {
    var metaData = data.meta.fields;
    var columnHeader = $('#select_fileds').val();
    if (!columnHeader.includes("Num_ID")){
        columnHeader = "Num_ID," + columnHeader;
    }
    var columnHeaderA = $('#select_filedsA').val();
    var columnHeaderB = $('#select_filedsB').val();
    this.rowAsString = '';
    this.authors = '';
    this.names = '';
    this.primaryName = '';
    this.qrHeaderName = '';
    this.numId = '';
    this.imageList = [];
    this.imageAList = [];
    this.textBString = '';
    this.dateAndCopyright = '';
    for (var header in metaData) {
        if (metaData.hasOwnProperty(header)) {
            var currentHeader = metaData[header];
            var currentItem = data.data[row][metaData[header]];
            if ((!!currentHeader && columnHeader.indexOf(currentHeader) !==-1) || (!!currentHeader && isStringInCategory(currentHeader, 'qr'))) {
                if (!!currentItem && /\S/.test(currentItem)) {
                    currentHeader = currentHeader.toString();
                    currentItem = currentItem.toString();
                    this.rowAsString += currentItem + ', ';
                    if (isStringInCategory(currentHeader, 'author'))
                        this.authors += currentItem + ', ';
                    if (isStringInCategory(currentHeader, 'name'))
                        this.names += currentItem + ', ';
                    if (isStringInCategory(currentHeader, 'id'))
                        this.numId = currentItem;
                    if (isStringInCategory(currentHeader, 'image_file'))
                        this.imageList.push(getExistingImageFile(currentItem));
                    if (isStringInCategory(currentHeader, 'date') && isStringInCategory(currentItem, 'copyright'))
                        this.dateAndCopyright = currentItem;
                }
                if (isStringInCategory(currentHeader, 'qr'))
                    this.qrHeaderName = currentHeader;
            }
            if (!!currentHeader && columnHeaderB.indexOf(currentHeader) !==-1) {
                if (!!currentItem && /\S/.test(currentItem)) {
                    currentHeader = currentHeader.toString();
                    currentItem = currentItem.toString();
                    this.textBString += currentItem + ' ';
                }
            }
            if (!!currentHeader && columnHeaderA.indexOf(currentHeader) !==-1) {
                if (!!currentItem && /\S/.test(currentItem)) {
                    currentHeader = currentHeader.toString();
                    currentItem = currentItem.toString();
                    if (isStringInCategory(currentHeader, 'image_file'))
                        this.imageAList.push(getExistingImageFile(currentItem));
                }
            }
        }
    }
    this.authors = this.authors.trim().replace(/,(?=[^,]*$)/, '');
    this.names = this.names.trim().replace(/,(?=[^,]*$)/, '');
    this.primaryName = this.names.split(',')[0].trim();
    this.dateAndCopyright = this.dateAndCopyright.trim();
    //(this.rowAsString + '\n' + this.authors + '\n' + this.names + '\nPrimary name' + this.primaryName + '\n' + this.numId + '\n' + this.dateAndCopyright + '\n ImageList' + this.imageList.toString() + '\nkjhgkjhg ' + this.qrHeaderName);
}

function getExistingImageFile(fileName) {
    if (!!fileName && (fileName.toString().toLowerCase().endsWith('.png') ||
        fileName.toString().toLowerCase().endsWith('.jpg') ||
        fileName.toString().toLowerCase().endsWith('.jpeg'))) {
        for (var i = 0; i < fileList.length; i++) {
            var fileListItem = fileList[i];
       //     console.log("========getExistingImageFile======= " + fileName.toLowerCase() + " -- " + fileListItem.name.toString().toLowerCase())
            if (fileName.toLowerCase() == fileListItem.name.toString().toLowerCase())
                return URL.createObjectURL(fileListItem).toString();
        }
    }
    return '';
}

function getArrayOfRandomIntegers(size, digitsInNumber) {
    if (digitsInNumber > 0) {
        var randIntArray = [];
        for (var i = 0; i < size; i++) {
            var currentNumber = Math.floor(Math.random() * 9 * Math.pow(10, digitsInNumber - 1) + Math.pow(10, digitsInNumber - 1));
            if (randIntArray.indexOf(currentNumber) == -1)
                randIntArray.push(currentNumber);
        }
        return randIntArray;
    }
    return null;
}

function toggleAudio() {

}

function scrollToElement(elementId) {
    var el = document.getElementById(elementId);
    var yPos = el.getClientRects()[0].top;
    var yScroll = window.scrollY;
    var interval = setInterval(function () {
        yScroll -= 10;
        window.scroll(0, yScroll);
        if (el.getClientRects()[0].top >= 0) {
            clearInterval(interval);
        }
    }, 5);
}

function onComplete() {
    if (!cardsComplete) {
        cardsComplete = true;
        createStickyTable()
        document.forms['cardForm']['submitButton'].disabled = false;
    }
}

function reset() {

    data = undefined;
    fileList = undefined;
    zip = new JSZip();
    cardUrls = [];
    cardUrlsB = [];
    loadBar = undefined;

    document.getElementById("loadBar").style.width = '0';
    document.getElementById("loadBarLabel").innerHTML = '';
    document.getElementById("tableDiv").innerHTML = '';
    document.getElementById("cardPreviewA").innerHTML = '';
    document.getElementById("cardPreviewB").innerHTML = '';
    document.getElementById("cardPreviewQrCode").innerHTML = '';
 //   document.getElementById("cardACanvasPreviewDiv").innerHTML = '';
 //   document.getElementById("cardBCanvasPreviewDiv").innerHTML = '';
    document.getElementById('dataFilesInputLabel').innerHTML = 'Download Cards';
    tableHeaderRow = undefined;
    fixedHeaderTable = undefined;
    fixedHeaderIsDisplayed = false;
    cardsComplete = false;
    isLastProcess = false;

    //document.forms['cardForm'].reset();
    document.forms['cardForm']['submitButton'].disabled = true;

}

function isStringInCategory(string, category) {
    return RegExp('(^|[^a-zA-Z\d])' + category + '([^a-zA-Z\d]|$)', 'i').test(string);
}




