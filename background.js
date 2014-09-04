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

chrome.tabs.onUpdated.addListener(function (id, info, tab) {
		if (tab.url.match(/^https\:\/\/chrome\.google\.com\/[^\?#]+\/[a-z]{32}([\/\?#]|$)/i)) {
			chrome.pageAction.show(id);
		}
	});

chrome.pageAction.onClicked.addListener(function(tab) {
		chrome.tabs.create({
				'url': chrome.extension.getURL('/inspect.html?') + tab.url.match(/[a-z]{32}/i),
				'index': tab.index + 1
			});
	});
