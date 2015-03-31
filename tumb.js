// Necessary HTML elements:
//   .pages container for .older and .newer
//     .older HREF pointing to the next page
//     .newer HREF pointing to the prev page
//   #posts OL containing the posts.

$(function(){
    var version = "2.0.2";
    var prefetching = false;
    var baseUrl = null
    var currentpage = 1;
    var lastpage = 1;
    var pagebuffer = [];

    function log(message){
        var args = $.extend([], arguments);
        args.unshift("[Prefetcher]");
        console.log.apply(console, args);
        return null;
    }

    function getCookie(name){
        var cookies = document.cookie.split(";");
        for(var i=0; i<cookies.length; i++){
            var pair = cookies[i].split("=");
            if(pair[0]==name) return pair[1];
        }
        return null;
    }

    function setCookie(name,val){
        log("Setting cookie",name,"to",val);
        var cookies = document.cookie.split(";");
        var found = false;
        for(var i=0; i<cookies.length; i++){
            var pair = cookies[i].split("=");
            if(pair[0] == name){
                pair[1] = val;
                found = true;
            }
            cookies[i]=pair.join("=");
        }
        if(!found)cookies.push(name+"="+val);
        document.cookie = cookies.join(";");
        return cookies;
    }

    function setPageOffset(n){
        return setCookie("prefetchOffset", n);
    }

    function getPreviousPageOffset(){
        var page = getCookie("prefetchPage");
        if(currentpage == page){
            var offset = getCookie("prefetchOffset");
            log("Offset on page was",offset);
            return offset;
        }
        return 0;
    }

    function detectPageInfo(){
        var pages = $(".pages").last();
        var nextpage = $(".older", pages).attr("href");
        if (nextpage !== undefined){
            baseUrl = nextpage.substr(0, nextpage.lastIndexOf("/") + 1);
            currentpage = parseInt(nextpage.substr(nextpage.lastIndexOf("/") + 1));
            currentpage--;
        }else{
            nextpage = $(".newer", pages).attr("href");
            baseUrl = nextpage.substr(0, nextpage.lastIndexOf("/") + 1);
            currentpage = parseInt(nextpage.substr(nextpage.lastIndexOf("/") + 1));
            currentpage++;
        }
        lastpage = currentpage;
        log("Detected base page url",baseUrl);
        log("Currently on page",currentpage);
        return currentpage;
    }

    function showSpinner(status){
        prefetching = status;
        if (status){
            log("Prefetching started.");
            $("#prefetcher").show();
        }else{
            log("Prefetching stopped.");
            $("#prefetcher").hide();
        }
        return prefetching;
    }

    function fetchPage(num, successfun){
        showSpinner(true);
        log("Fetching page",num);
        return $.ajax({
            url: baseUrl+num,
            type: "GET",
            dataType: "html"
        }).done(successfun).always(function(){
            showSpinner(false);
        });
    }

    function generatePager(num){
        return $.parseHTML('<li class="pager" data-pagenum="'+num+'"><hr /></li>');
    }

    function findCurrentPage(){
        var pagers = $(".pager");
        var current = null;
        for (var i = 0; i < pagers.length; i++){
            var el = $(pagers[i]);
            if (window.pageYOffset > el.offset().top){
                current = parseInt(el.attr("data-pagenum"));
            }
        }
        return current;
    }

    function setCurrentPage(page){
        if(page != currentpage && page != null){
            log("Currently on page",page);
            currentpage = page;
            window.history.pushState("prefetch", "page"+page, baseUrl+page);
            setCookie("prefetchPage", page);
        }
        return currentpage;
    }

    function initScrollTracking(element){
        var end = false;
        $(element).on('scroll', function(){
            var bottom = element.pageYOffset + $(element).height();
            if (bottom > $(".pages").last().offset().top && !prefetching && !end){
                fetchPage(lastpage+1, function(data){
                    log("Got next page data.");
                    var posts = $("#posts>li", data);
                    if (posts.length > 0){
                        lastpage++;
                        log("Appending data.");
                        $("#posts").append(generatePager(lastpage));
                        $("#posts").append(posts);
                    }else{
                        end = true;
                        log("Reached end.");
                    }
                });
            }
            // Update history
            var page = findCurrentPage();
            setCurrentPage(page);
            setPageOffset(element.pageYOffset);
        });
    }

    function init(){
        log("Init",version);
        
        detectPageInfo();
        window.scrollTo(0, getPreviousPageOffset());
        $("#posts").prepend(generatePager(currentpage));
        initScrollTracking(window);

        log("Ready.");
    }

    init();
});
