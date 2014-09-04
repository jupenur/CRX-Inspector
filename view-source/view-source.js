/**
 * Copyright (c) 2011 Juho Nurminen
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

function escapeHTML(s) {
	return s.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
}

function parseTag(s) {
	s = '<span class="webkit-html-tag">&lt;' +
		s.substr(1, s.length-2).replace(/(?:(^[^\s]+\b)|(\s)([^\s=]+)(?:(=)(?:"([^"]*)"|'([^']*)'|([^"'\s][^\s]*))?)?|(.))/g,
			function (match, tagName, whiteSpace, attributeName, equals, doubleQuotedValue, quotedValue, unQuotedValue, other) {
				var replacement;

				if (tagName) {
					return escapeHTML(tagName);
				} else if (attributeName) {
					replacement = whiteSpace + '<span class="webkit-html-attribute-name">' +
						escapeHTML(attributeName).replace(/\n/g, '</span>\n<span class="webkit-html-attribute-name">') +
						'</span>';

					replacement += equals || '';

					if (doubleQuotedValue) {
						replacement += '&quot;<span class="webkit-html-attribute-value">' +
							escapeHTML(doubleQuotedValue).replace(/\n/g, '</span>\n<span class="webkit-html-attribute-value">') +
							'</span>&quot;';
					} else if (quotedValue) {
						replacement += '\'<span class="webkit-html-attribute-value">' +
							escapeHTML(quotedValue).replace(/\n/g, '</span>\n<span class="webkit-html-attribute-value">') +
							'</span>\'';
					} else if (unQuotedValue) {
						replacement += '<span class="webkit-html-attribute-value">' +
							escapeHTML(unQuotedValue).replace(/\n/g, '</span>\n<span class="webkit-html-attribute-value">') +
							'</span>';
					}

					return replacement;
				} else if (other) {
					return escapeHTML(other);
				}
			}) +
		'&gt;</span>';

	return s.replace(/\n/g, '</span>\n<span class="webkit-html-tag">');
}

function parseHTML(s) {
	return s.replace(/(<!DOCTYPE\b[^>]*>)|(<!(?:--[\S\s]*?--|[^>]*)>)|(<([^\s>]+)(?:\s[^=>]+=(?:"[^"]*"|'[^']*')|[^>]*)*>)(?:([\S\s]*?)(<\/\4(?:\b[^>])?>))?|(.)/ig,
		function (match, doctype, comment, opener, tagname, content, closer, other) {
			var replacement;

			if (doctype) {
				replacement = '<span class="webkit-html-doctype">' +
					escapeHTML(doctype).replace(/\n/g, '</span>\n<span class="webkit-html-doctype">') +
					'</span>';
			} else if (comment) {
				replacement = '<span class="webkit-html-comment">' +
					escapeHTML(comment).replace(/\n/g, '</span>\n<span class="webkit-html-comment">') +
					'</span>';
			} else if (opener) {
				replacement = parseTag(opener);
				if (content) {
					if (tagname.toLowerCase() == 'script' || tagname.toLowerCase() == 'style' || tagname.toLowerCase() == 'title') {
						replacement += escapeHTML(content);
					} else {
						replacement += parseHTML(content);
					}
				}
				if (closer) {
					replacement += parseTag(closer);
				}
			} else {
				replacement = escapeHTML(other);
			}

			return replacement;
		});
}

addEventListener('load', function () {
		var i,
			attribs = location.search.substr(1).split('&'),
			icon, mimeType = 'text/plain', content,
			output;

		// parse attributes
		for (i = 0; i < attribs.length; i++) {
			attribs[i] = [
					decodeURIComponent(attribs[i].split('=')[0]),
					decodeURIComponent(attribs[i].substr(attribs[i].indexOf('=')+1 || attribs[i].length))
				];

			if (attribs[i][0] == 'n') { // file name
				document.title += ':' + attribs[i][1];
			} else if (attribs[i][0] == 'i') { // icon
				icon = document.createElement('link');
				icon.setAttribute('rel', 'icon');
				icon.setAttribute('href', attribs[i][1]);
				document.head.appendChild(icon);
			} else if (attribs[i][0] == 'm') { // mime type
				mimeType = attribs[i][1].toLowerCase();
			} else if (attribs[i][0] == 'c') { // content
				content = attribs[i][1];
			}
		}

		// highlight syntax
		if (content) {
			if (mimeType in {'text/html':1, 'application/xhtml+xml':1, 'application/xml':1, 'text/xml':1}) {
				content = parseHTML(content);
			} else {
				content = escapeHTML(content);
			}
			content = content.split('\n');

			// build html
			output = '<head><link rel="stylesheet" type="text/css" href="view-source.css"></head>' +
				'<body><div class="webkit-line-gutter-backdrop"></div><table><tbody>';
			for (i = 0; i < content.length; i++) {
				output += '<tr><td class="webkit-line-number"></td><td class="webkit-line-content">' + (content[i] || ' ') + '</td></tr>';
			}
			output += '</tbody></table>';

			// spit it out
			document.getElementsByTagName('iframe')[0].contentDocument.documentElement.innerHTML = output;
		}
	});
