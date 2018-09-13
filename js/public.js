var Public = window.Public || {};
Public.url = (()=>{
    // var url = 'http://192.168.1.150:1002';
    // var url = 'http://192.168.1.178:1002'
    var url = 'http://www.redkross.com';
    // var url = 'http://120.79.165.4:9015'
    return url
});
Public.timeTo = ((timestamp)=>{
    //时间戳转化成时间格式
    function add0(m){return m<10?'0'+m:m }
    function timeFormat(timestamp){
        var time = new Date(timestamp);
        var year = time.getFullYear();
        var month = time.getMonth()+1;
        var date = time.getDate();
        var hours = time.getHours();
        var minutes = time.getMinutes();
        var seconds = time.getSeconds();
        return year+'-'+add0(month)+'-'+add0(date)+' '+add0(hours)+':'+add0(minutes)+':'+add0(seconds);
    }
    return timeFormat
});
Public.ossUrl = (()=>{
    let ossUrl = 'https://imuts.oss-cn-shenzhen.aliyuncs.com';
    return ossUrl
});
Public.getAge = ((birthdate) => {
	/*计算年龄*/
	var nowDate = Public.timeTo()(new Date());
	var age = 0;
	if(nowDate >= birthdate) {
		if(nowDate.substr(5,5) >= birthdate.substr(5,5)) {
			age = nowDate.substr(0, 4) - birthdate.substr(0, 4);
		} else {
			age = nowDate.substr(0, 4) - birthdate.substr(0, 4) - 1;
		}
	}
	return age;
});
Public.initPhotoSwipeFromDOM = function (gallerySelector) {
    // 解析来自DOM元素幻灯片数据（URL，标题，大小...）
    var parseThumbnailElements = function (el) {
        var thumbElements = el.childNodes,
            numNodes = thumbElements.length,
            items = [],
            images_WxH = [],
            figureEl,
            linkEl,
            size,
            item,
            divEl;
    	for (var i = 0,d=0; i < numNodes; i++) {
            figureEl = thumbElements[i]; // <figure> element
            // 仅包括元素节点
            if (figureEl.nodeType !== 1) {
                continue;
            }
            divEl = figureEl.children[0];
            linkEl = divEl.children[0]; // <a> element
			if (sessionStorage.PhotoSwipeImages_WxH) {
				images_WxH = JSON.parse(sessionStorage.PhotoSwipeImages_WxH);
			} else {
				size = linkEl.getAttribute('data-size').split('x');
				images_WxH.push({
					w: parseInt(size[0], 10),
					h: parseInt(size[1], 10)
				});
			}
            
            // 创建幻灯片对象
            item = {
                src: linkEl.getAttribute('href'),
                w: images_WxH[d].w,
                h: images_WxH[d].h
            };
            if (figureEl.children.length > 1) {
                item.title = figureEl.children[1].innerHTML;
            }
            if (linkEl.children.length > 0) {
                // <img> 缩略图节点, 检索缩略图网址
                item.msrc = linkEl.children[0].getAttribute('src');
            }
            item.el = figureEl; // 保存链接元素 for getThumbBoundsFn
            items.push(item);
			d++;
        }
    	sessionStorage.PhotoSwipeImages_WxH = JSON.stringify(images_WxH);
        return items;
    };

    // 查找最近的父节点
    var closest = function closest(el, fn) {
        return el && (fn(el) ? el : closest(el.parentNode, fn));
    };

    // 当用户点击缩略图触发
    var onThumbnailsClick = function (e) {
        e = e || window.event;
        e.preventDefault ? e.preventDefault() : e.returnValue = false;
        var eTarget = e.target || e.srcElement;
        var clickedListItem = closest(eTarget, function (el) {
            return (el.tagName && el.tagName.toUpperCase() === 'FIGURE');
        });
        if (!clickedListItem) {
            return;
        }
        var clickedGallery = clickedListItem.parentNode,
            childNodes = clickedListItem.parentNode.childNodes,
            numChildNodes = childNodes.length,
            nodeIndex = 0,
            index;
        for (var i = 0; i < numChildNodes; i++) {
            if (childNodes[i].nodeType !== 1) {
                continue;
            }
            if (childNodes[i] === clickedListItem) {
                index = nodeIndex;
                break;
            }
            nodeIndex++;
        }
        if (index >= 0) {
            openPhotoSwipe(index, clickedGallery);
        }
        return false;
    };

    var photoswipeParseHash = function () {
        var hash = window.location.hash.substring(1),
            params = {};
        if (hash.length < 5) {
            return params;
        }
        var vars = hash.split('&');
        for (var i = 0; i < vars.length; i++) {
            if (!vars[i]) {
                continue;
            }
            var pair = vars[i].split('=');
            if (pair.length < 2) {
                continue;
            }
            params[pair[0]] = pair[1];
        }
        if (params.gid) {
            params.gid = parseInt(params.gid, 10);
        }
        return params;
    };

    var openPhotoSwipe = function (index, galleryElement, disableAnimation, fromURL) {
        var pswpElement = document.querySelectorAll('.pswp')[0],
            gallery,
            options,
            items;
        items = parseThumbnailElements(galleryElement);
        // 这里可以定义参数
        options = {
            barsSize: {
                top: 100,
                bottom: 100
            },
            fullscreenEl: false,
            shareButtons: [
                { id: 'wechat', label: '分享微信', url: '#' },
                { id: 'weibo', label: '新浪微博', url: '#' },
                { id: 'download', label: '保存图片', url: '{{raw_image_url}}', download: true }
            ],
            galleryUID: galleryElement.getAttribute('data-pswp-uid'),
            getThumbBoundsFn: function (index) {
                var thumbnail = items[index].el.getElementsByTagName('img')[0], // find thumbnail
                    pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
                    rect = thumbnail.getBoundingClientRect();
                return { x: rect.left, y: rect.top + pageYScroll, w: rect.width };
            }
        };
        if (fromURL) {
            if (options.galleryPIDs) {
                for (var j = 0; j < items.length; j++) {
                    if (items[j].pid == index) {
                        options.index = j;
                        break;
                    }
                }
            } else {
                options.index = parseInt(index, 10) - 1;
            }
        } else {
            options.index = parseInt(index, 10);
        }
        if (isNaN(options.index)) {
            return;
        }
        if (disableAnimation) {
            options.showAnimationDuration = 0;
        }
        gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
        gallery.listen('close', function() {
        	sessionStorage.removeItem("PhotoSwipeImages_WxH");
        });
        gallery.init();
    };

	//设置image的大小
	function setImgSize(el, callback) {
		var thumbElements = el.childNodes,
            numNodes = thumbElements.length,
            figureEl,
            linkEl,
            size,
            item,
            divEl;
    	for (var i = 0,d=0; i < numNodes; i++) {
            figureEl = thumbElements[i]; // <figure> element
            // 仅包括元素节点
            if (figureEl.nodeType !== 1) {
                continue;
            }
            divEl = figureEl.children[0];
            linkEl = divEl.children[0]; // <a> element
            imgLoadComplete(linkEl,callback);
	        //linkEl.setAttribute('data-size', imgLoadComplete(linkEl));
	        d++;
       	}
	}
	
	//图片加载完成
	function imgLoadComplete(linkEl,callback) {
        var img = new Image();
        img.src = linkEl.getAttribute('href');
		img.onload = function () {
	        linkEl.setAttribute('data-size', this.width + 'x' + this.height);
	        typeof callback === "function" && callback();
       }
	}

    var galleryElements = document.querySelectorAll(gallerySelector);
    for (var i = 0, l = galleryElements.length; i < l; i++) {
        galleryElements[i].setAttribute('data-pswp-uid', i + 1);
        galleryElements[i].onclick = onThumbnailsClick;
        setImgSize(galleryElements[i]);
    }
    var hashData = photoswipeParseHash();
    if (hashData.pid && hashData.gid) {
        openPhotoSwipe(hashData.pid, galleryElements[hashData.gid - 1], true, true);
    }
};
