/**
 * Copyright (c) 2011, 2013 Juho Nurminen
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not be
 *    misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

addEventListener('load', function () {
    var id = (location.search || '?').substr(1),
        xhr = new XMLHttpRequest(),
        archive = new JSUnzip(),
        list = document.getElementById('list'),
        data, pubkey, sig, manifest,

        mkDir = function (name) {
                var a, ul, li,
                    parent = name.substr(0, name.substr(0, name.length-1).lastIndexOf('/')+1);

                if (parent) {
                    if (document.getElementById(parent)) {
                        parent = document.getElementById(parent);
                    } else {
                        parent = mkDir(parent);
                    }
                } else {
                    parent = list;
                }

                a = document.createElement('a');
                a.innerText = name.substring(name.substr(0, name.length-1).lastIndexOf('/')+1, name.length-1);
                a.setAttribute('class', 'closed');
                ul = document.createElement('ul');
                ul.id = name;
                li = document.createElement('li');
                li.appendChild(a);
                li.appendChild(ul);
                parent.appendChild(li);
                a.addEventListener('click', (function (ul) {
                        return function (e) {
                                if (this.getAttribute('class') == 'open') {
                                    ul.style.display = '';
                                    this.setAttribute('class', 'closed');
                                } else {
                                    ul.style.display = 'block';
                                    this.setAttribute('class', 'open');
                                }
                                e.preventDefault();
                            };
                    }(ul)));

                return ul;
            },

        mkFile = function (name) {
                var size, a, li, click,
                    parent = name.substr(0, name.lastIndexOf('/')+1);

                if (parent) {
                    if (document.getElementById(parent)) {
                        parent = document.getElementById(parent);
                    } else {
                        parent = mkDir(parent);
                    }
                } else {
                    parent = list;
                }

                size = document.createElement('div');
                size.innerText = mkSize(archive.files[name].uncompressedSize);

                a = document.createElement('a');
                a.innerText = name.substr(name.lastIndexOf('/')+1);
                a.appendChild(size);

                li = document.createElement('li');
                li.appendChild(a);

                parent.appendChild(li);

                a.addEventListener('click', (function (name) {
                        return function (e) {
                                var mime, file, isText;

                                // map extension to mime type
                                switch ((name.match(/\.[^\/\.]+$/) || [''])[0].toLowerCase()) {
                                    case '.html':
                                    case '.htm':
                                    case '.xhtml':
                                        mime = 'text/html';
                                        isText = true;
                                        break;
                                    case '.css':
                                        mime = 'text/css';
                                        isText = true;
                                        break;
                                    case '.js':
                                        mime = 'application/javascript';
                                        isText = true;
                                        break;
                                    case '.json':
                                        mime = 'application/json';
                                        isText = true;
                                        break;
                                    case '.xml':
                                        mime = 'application/xml';
                                        isText = true;
                                        break;
                                    case '.png':
                                        mime = 'image/png';
                                        break;
                                    case '.jpg':
                                    case '.jpe':
                                    case '.jpeg':
                                        mime = 'image/jpeg';
                                        break;
                                    case '.gif':
                                        mime = 'image/gif';
                                        break;
                                    case '.svg':
                                        mime = 'image/svg+xml';
                                        break;
                                    case '.bmp':
                                        mime = 'image/bmp';
                                        break;
                                    case '.ico':
                                        mime = 'image/x-icon';
                                        break;
                                    case '.swf':
                                        mime = 'application/x-shockwave-flash';
                                        break;
                                    case '.mp3':
                                        mime = 'audio/mpeg';
                                        break;
                                    case '.txt':
                                        mime = 'text/plain';
                                        isText = true;
                                        break;
                                    default:
                                        mime = undefined;
                                }
                                file = archive.read(name);
                                if (file.status) {
                                    if (isText) {
                                        // open the source viewer
                                        if (e.button == 1) {
                                            window.open('view-source/view-source.html' +
                                                '?n=' + encodeURIComponent(name) +
                                                '&m=' + mime +
                                                '&c=' + escape(file.data));
                                        } else {
                                            document.getElementsByTagName('iframe')[0].src = 'view-source/view-source.html' +
                                                '?n=' + encodeURIComponent(name) +
                                                '&m=' + mime +
                                                '&c=' + escape(file.data);
                                            (document.getElementsByClassName('inviewer')[0] || this).removeAttribute('class');
                                            this.setAttribute('class', 'inviewer');
                                        }
                                    } else {
                                        if (mime === undefined) {
                                            // unknown file type
                                            document.getElementsByTagName('iframe')[0].src = 'data:text/html;base64,' + btoa(
                                                    '<html>\n' +
                                                    '	<head>\n' +
                                                    '		<link rel="stylesheet" href="' + chrome.extension.getURL('unknown.css') + '">\n' +
                                                    '	</head>\n' +
                                                    '	<body>\n' +
                                                    '		CRX Inspector doesn\'t know how to handle this file. \n' +
                                                    '		You can either <a href="data:application/octet-stream;base64,' + btoa(file.data) + '">download</a> it\n' +
                                                    '		or <a href="' +
                                                            chrome.extension.getURL('view-source/view-source.html') + '?n=' + encodeURIComponent(name) +
                                                            '&m=text/plain&c=' + escape(file.data) +
                                                            '">view</a> it as plain text.'
                                                );
                                            (document.getElementsByClassName('inviewer')[0] || this).removeAttribute('class');
                                            this.setAttribute('class', 'inviewer');
                                        } else {
                                            if (e.button == 1) {
                                                window.open('data:' + mime + ';base64,' + btoa(file.data));
                                            } else {
                                                document.getElementsByTagName('iframe')[0].src = 'data:' + mime + ';base64,' + btoa(file.data);
                                                (document.getElementsByClassName('inviewer')[0] || this).removeAttribute('class');
                                                this.setAttribute('class', 'inviewer');
                                            }
                                        }
                                    }
                                } else {
                                    console.warn('Error reading file: ' + name);
                                }
                                e.preventDefault();
                            };
                    }(name)));

                if (name == 'manifest.json') {
                    click = document.createEvent('MouseEvents');
                    click.initMouseEvent('click');
                    a.dispatchEvent(click);
                }
            },

        mkSize = function (bytes) {
                if (bytes > 1048576) {
                    return (bytes/1048576).toFixed(2) + ' MiB';
                } else if (bytes > 1024) {
                    return (bytes/1024).toFixed(2) + ' KiB';
                } else {
                    return bytes + ' B';
                }
            };

    (function () {
        // fix weird errors in archive.read
        var i, blob = '', read = archive.read;
        archive.read = function (name) {
            var result = read.apply(this, [name]);
            if (!result.status && !result.data && !result.error) {
                console.warn('Unable to decompress "' + name + '", returning raw data');
                for (i = 0; i < this.data.length; i++) {
                    blob += String.fromCharCode(this.data.charCodeAt(i) & 0xFF);
                }
                result = {
                        'status': true,
                        'data': blob.substr(this.files[name].localFileContent+5, this.files[name].uncompressedSize)
                    };
            }
            return result;
        }
    }());

    xhr.open('GET', 'http://clients2.google.com/service/update2/crx?response=redirect&prodversion=' + navigator.userAgent.match(/Chrome\/([\d\.]+)/)[1] + '&x=uc%26id%3D' + id);
    xhr.overrideMimeType('text/plain; charset=x-user-defined');

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {

            // discard CRX headers (http://code.google.com/chrome/extensions/crx.html)
            pubkey = xhr.responseText.charCodeAt(8) & 0xFF;
            sig = xhr.responseText.charCodeAt(12) & 0xFF;
            data = xhr.responseText.substr(16 + pubkey + sig);

            // extract the data
            if (archive.open(data).status) {

                try {
                    manifest = JSON.parse(decodeURIComponent(escape(archive.read('manifest.json').data))); // assuming UTF-8
                } catch (e) {
                    console.warn('Error parsing manifest.json: ' + e);
                    manifest = { 'name': 'CRX Package' };
                }
                document.title = manifest.name + ' | CRX Inspector';
                document.getElementById('name').innerText = manifest.name;

                for (name in archive.files) {
                    if (name[name.length-1] == '/') {
                        mkDir(name);
                    } else {
                        mkFile(name);
                    }
                }

            }
        }
    }

    xhr.send(null);
});
