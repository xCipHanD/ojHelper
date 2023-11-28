// ==UserScript==
// @name         OJ助手
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Help you uploading files.
// @author       xciphand.icu
// @match        https://oj.cse.sustech.edu.cn/*
// @icon         https://oj.cse.sustech.edu.cn/icon.png
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    function getCookieValue(key) {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            if (cookie.startsWith(key + '=')) {
                return cookie.substring(key.length + 1);
            }
        }
        return null;
    }

    function checkSelection() {
        var selectElement = document.getElementById('selectElement');
        var submitButton = document.getElementById('submitButton');

        if (selectElement.value === '请选择题目') {
            submitButton.disabled = true;
        } else {
            submitButton.disabled = false;
        }
    }

    // Inject CSS styles
    var style = document.createElement('style');
    style.innerHTML = `
        .upload-dialog-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50%;
            height: calc(50vw / 4 * 3);
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
        }

        .upload-dialog-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            opacity: 0;
            transition: opacity 0.3s;
        }

        .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 16px;
            cursor: pointer;
            color: red;
        }

        .upload-dialog-container .drop-area {
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px dashed #ccc;
            border-radius: 10px;
            margin: 20px;
            height: 150px;
            font-size: 18px;
            color: #999;
            cursor: pointer;
        }

        .upload-dialog-container .file-list {
            padding: 10px;
            border-top: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            max-height: calc(100% - 120px);
            overflow-y: scroll;
        }

        .upload-dialog-container .file-list-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }

        .upload-dialog-container .file-list-item .file-name {
            flex-grow: 1;
            margin-left: 10px;
        }

        .upload-dialog-container .button-container {
            display: flex;
            justify-content: flex-end;
            padding: 10px;
        }

        .upload-dialog-container .button-container button {
            margin-left: 10px;
        }

        .upload-dialog-container select {
            width: 100%;
            height: 30px;
            font-size: 16px;
            margin-top: 10px;
        }
    `;
    document.head.appendChild(style);

    setInterval(function () {
        let url = window.location.href;
        if (url.includes('homework') && url.includes('course') && url.includes('#submit')) {
            url = url.split('/');
            var courseId = url[url.length - 3];
            var homeworkId = url[url.length - 1].split('#')[0];
            try {
                if (document.querySelector('#multiUpload') == null) {
                    let uploadDiv = document.querySelector("#animation-display > div > div.four.wide.column > div:nth-child(5) > div");
                    let flag = uploadDiv.innerHTML.includes("No files")
                    if (flag) {
                        // Create the upload button
                        var uploadButton = document.createElement('button');
                        uploadButton.className = 'ui orange button';
                        uploadButton.textContent = '批量上传';
                        uploadButton.id = 'multiUpload';

                        var reloadButton = document.createElement('button');
                        reloadButton.className = 'ui orange button';
                        reloadButton.textContent = '载入上次代码';
                        reloadButton.addEventListener('click', function () {
                            document.querySelector("#animation-display > div > div.four.wide.column > div.ui.bottom.attached.segment > div.ui.divided.relaxed.middle.aligned.list > div.item.final-record-row > div.ui.divided.horizontal.middle.aligned.list > div:nth-child(1) > span").click()
                        })
                        uploadButton.addEventListener('click', function () {
                            var dialogContainer = document.createElement('div');
                            dialogContainer.className = 'upload-dialog-container';
                            var overlay = document.createElement('div');
                            overlay.className = 'upload-dialog-overlay';
                            var dropArea = document.createElement('div');
                            dropArea.className = 'drop-area';
                            dropArea.textContent = '将文件拖放到此区域';
                            dropArea.addEventListener('dragover', function (event) {
                                event.preventDefault();
                                dropArea.style.border = '2px dashed #999';
                            });
                            dropArea.addEventListener('dragleave', function () {
                                dropArea.style.border = '2px dashed #ccc';
                            });
                            dropArea.addEventListener('drop', function (event) {
                                event.preventDefault();
                                dropArea.style.border = '2px dashed #ccc';
                                var files = event.dataTransfer.files;
                                for (var i = 0; i < files.length; i++) {
                                    var file = files[i];
                                    var listItem = document.createElement('div');
                                    listItem.className = 'file-list-item';
                                    var fileName = document.createElement('div');
                                    fileName.className = 'file-name';
                                    fileName.textContent = file.name;
                                    listItem.appendChild(fileName);
                                    fileList.appendChild(listItem);

                                    var reader = new FileReader();
                                    reader.onload = (function (file) {
                                        return function (e) {
                                            var fileContent = e.target.result;
                                            var escapedContent = fileContent.replace(/\n/g, '\n');
                                            var hiddenInput = document.createElement('input');
                                            hiddenInput.type = 'hidden';
                                            hiddenInput.name = file.name;
                                            hiddenInput.value = escapedContent;
                                            fileList.appendChild(hiddenInput);
                                            filesData[file.name] = escapedContent;
                                        };
                                    })(file);
                                    reader.readAsText(file);
                                }
                            });
                            var fileList = document.createElement('div');
                            fileList.className = 'file-list';
                            var buttonContainer = document.createElement('div');
                            buttonContainer.className = 'button-container';
                            var submitButton = document.createElement('button');
                            submitButton.className = 'ui green button';
                            submitButton.textContent = '上传';
                            submitButton.id = 'submitButton';
                            submitButton.disabled = true;
                            var cancelButton = document.createElement('button');
                            cancelButton.className = 'ui red button';
                            cancelButton.textContent = '关闭';
                            cancelButton.addEventListener('click', function () {
                                dialogContainer.style.opacity = '0';
                                overlay.style.opacity = '0';
                                setTimeout(function () {
                                    document.body.removeChild(dialogContainer);
                                    document.body.removeChild(overlay);
                                }, 300);
                            });
                            // 构造下拉框
                            var selectElement = document.createElement('select');
                            selectElement.id = 'selectElement';
                            selectElement.name = 'problemId';
                            selectElement.className = 'ui dropdown';
                            selectElement.style.width = '30%';
                            selectElement.style.height = '60%';
                            selectElement.style.fontSize = '16px';
                            selectElement.style.marginTop = '10px';
                            selectElement.addEventListener('change', checkSelection);

                            const Csrftoken = getCookieValue('csrftoken');
                            var params = new URLSearchParams();
                            params.append('homeworkId', homeworkId);
                            params.append('courseId', courseId);
                            var headers = new Headers();
                            headers.append('X-Csrftoken', Csrftoken);
                            // 发送 POST 请求
                            fetch('https://oj.cse.sustech.edu.cn/api/homework/problems/list/', {
                                method: 'POST',
                                headers: headers,
                                body: params
                            })
                                .then(function (response) {
                                    if (response.status === 200) {
                                        return response.json(); // 解析JSON数据
                                    }
                                })
                                .then(function (data) {
                                    // Add the default option
                                    var defaultOption = document.createElement('option');
                                    defaultOption.selected = true;
                                    defaultOption.disabled = true;
                                    defaultOption.textContent = '请选择题目';
                                    selectElement.appendChild(defaultOption);

                                    for (var i = 0; i < data.list.length; i++) {
                                        var optionElement = document.createElement('option');
                                        optionElement.value = data.list[i].problemId;
                                        optionElement.textContent = data.list[i].problemName;
                                        selectElement.appendChild(optionElement);
                                    }
                                })
                                .catch(function (error) {
                                    console.log('Request failed', error);
                                });

                            submitButton.addEventListener('click', function () {
                                var filesData = {};
                                var hiddenInputs = fileList.querySelectorAll('input[type="hidden"]');
                                if (hiddenInputs.length != 0) {
                                    hiddenInputs.forEach(function (hiddenInput) {
                                        var fileName = hiddenInput.name;
                                        var escapedContent = hiddenInput.value;
                                        //删除所有注释
                                        escapedContent = escapedContent.replace(/\/\/.*/g, '');
                                        filesData[fileName] = escapedContent;
                                    });
                                } else {
                                    return;
                                }
                                var jsonData = JSON.stringify(filesData);
                                var problemId = selectElement.value;
                                var language = 0;
                                var subGroup = true;


                                params.append('problemId', problemId);
                                fetch('https://oj.cse.sustech.edu.cn/api/homework/submit/info/', {
                                    method: 'POST',
                                    headers: headers,
                                    body: params
                                })
                                    .then(function (response) {
                                        if (response.status === 200) {
                                            return response.json();
                                        }
                                    }).then(function (data) {
                                        language = data.languageList[0].langCode;
                                        subGroup = data.allowSubGroup;
                                        // console.log(language, subGroup);
                                    }).then(function () {
                                        // console.log(courseId, homeworkId, problemId, language, subGroup, jsonData);
                                        // console.log(Csrftoken);
                                        params.append('language', language);
                                        params.append('subGroup', subGroup);
                                        params.append('files', jsonData);

                                        // // 发送 POST 请求
                                        fetch('https://oj.cse.sustech.edu.cn/api/homework/submit/objective/', {
                                            method: 'POST',
                                            headers: headers,
                                            body: params
                                        })
                                            .then(function (response) {
                                                if (response.status === 200) {
                                                    console.log('上传成功');
                                                    return response.json();
                                                }
                                            }).then(function (data) {
                                                var recordId = data.recordId;
                                                window.location.href = 'https://oj.cse.sustech.edu.cn/course/' + courseId + '/homework/' + homeworkId + '/record/' + recordId + '#result';
                                            })
                                            .catch(function (error) {
                                                log('Request failed', error);
                                            });
                                    })
                                    .catch(function (error) {
                                        console.log('Request failed', error);
                                    });

                                this.disabled = true;
                                this.textContent = '上传中';
                                this.style.className = 'ui dark-green button';
                            });

                            // Create the author label
                            var authorLabel = document.createElement('div');
                            authorLabel.className = 'author-label';
                            authorLabel.innerHTML = 'OJ 助手 by xciphand <a href="https://github.com/xciphand/ojHelper" target="_blank">欢迎star ~</a>';
                            authorLabel.style.textAlign = 'center';
                            authorLabel.style.marginTop = '16px';
                            dialogContainer.appendChild(authorLabel);
                            dialogContainer.appendChild(dropArea);
                            dialogContainer.appendChild(fileList);
                            dialogContainer.appendChild(buttonContainer);
                            buttonContainer.appendChild(selectElement);
                            buttonContainer.appendChild(submitButton);
                            buttonContainer.appendChild(cancelButton);
                            document.body.appendChild(dialogContainer);
                            document.body.appendChild(overlay);
                            setTimeout(function () {
                                dialogContainer.style.opacity = '1';
                                overlay.style.opacity = '1';
                            }, 10);
                        });
                        uploadDiv.appendChild(uploadButton);
                        uploadDiv.appendChild(reloadButton);
                    }
                }
            } catch (error) {
                return;
            }
        } else { return; }

    }, 200);
})();


