const delay = function() {
    const spinner = document.getElementById('js-loading');
    spinner.classList.add('is-loaded');
}

window.onload = setTimeout(delay, 2000);

jQuery(function($){
    $('.js-baricon').on('click', function(){
        $('.c-drawer').addClass('is-active');
    });

    $('.js-batsu').on('click', function(){
        $('.c-drawer').removeClass('is-active');
    });

    $('.c-drawer__link').click(function(){
        $('.c-drawer').removeClass('is-active');
    });

    $('a[href^="#"]').click(function(){  // hrefが『#』で始まるリンクのものをクリックした時
        var speed = 500;  // スクロールの速さ数字が小さいほど速い
        var href = $(this).attr('href')    // href属性の値を取得
        var target = $(href == "#" || href == "" ? 'html' : href);    // hrefが#もしくは空の時はtargetに(′html′)が代入、それ以外は(href)がtargetに代入される。
        var position = target.offset().top - 56;    // targetまでの位置を取得 +100はheaderの高さ
        $('html, body').animate({scrollTop:position}, speed, 'swing');    // animateプロパティで動きを決める
        return false;
    });

    $(window).scroll(function(){
        var $hero = $('.js-hero').innerHeight();
        if($(this).scrollTop() > $hero){
            $('.js-header').addClass('is-open');
        }else{
            $('.js-header').removeClass('is-open');
        }
    });
    
})