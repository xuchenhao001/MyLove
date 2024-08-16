// variables
var $window = $(window), gardenCtx, gardenCanvas, $garden, garden;
var clientWidth = $(window).width();
var clientHeight = $(window).height();

$(function () {
    var $loveHeart = $("#loveHeart");
    $garden = $("#garden");
    gardenCanvas = $garden[0];
    gardenCanvas.width = $loveHeart.width();
    gardenCanvas.height = $loveHeart.height();
    gardenCtx = gardenCanvas.getContext("2d");
    gardenCtx.globalCompositeOperation = "lighter";
    garden = new Garden(gardenCtx, gardenCanvas);

    // renderLoop
    setInterval(function () {
        garden.render();
    }, Garden.options.growSpeed);
});

$(window).resize(function () {
    var newWidth = $(window).width();
    var newHeight = $(window).height();
    if (newWidth !== clientWidth && newHeight !== clientHeight) {
        location.replace(location);
    }
});

function getHeartPoint(offsetX, offsetY, angle, heartWidth) {
    scale = heartWidth / 35
    var t = angle / Math.PI;
    var x = scale * (16 * Math.pow(Math.sin(t), 3));
    var y = - scale * 40 / 39 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return [offsetX + x, offsetY + y];
}

function startHeartAnimation(offsetX, offsetY, heartWidth) {
    // classic interval: 25
    var interval = 25;
    var angle = 10;
    var heart = [];
    var animationTimer = setInterval(function () {
        var bloom = getHeartPoint(offsetX, offsetY, angle, heartWidth);
        var draw = true;
        for (var i = 0; i < heart.length; i++) {
            var p = heart[i];
            var distance = Math.sqrt(Math.pow(p[0] - bloom[0], 2) + Math.pow(p[1] - bloom[1], 2));
            if (distance < Garden.options.bloomRadius.max * 1.3) {
                draw = false;
                break;
            }
        }
        if (draw) {
            heart.push(bloom);
            garden.createRandomBloom(bloom[0], bloom[1]);
        }
        if (angle >= 30) {
            clearInterval(animationTimer);
            showMessages(offsetX, offsetY, heartWidth);
        } else {
            angle += 0.2;
        }
    }, interval);
}

function timeElapseDate(dateDiff) {
    timeToShow = ""
    if (dateDiff.years > 0) {
        timeToShow += "<span class=\"digit\"><b>" + String(dateDiff.years).padStart(2, '0') + "</b></span> year "
        timeToShow += "<span class=\"digit\"><b>" + String(dateDiff.months).padStart(2, '0') + "</b></span> month "
    }
    else if (dateDiff.months > 0) {
        timeToShow += "<span class=\"digit\"><b>" + String(dateDiff.months).padStart(2, '0') + "</b></span> month "
    }
    timeToShow += "<span class=\"digit\"><b>" + String(dateDiff.days).padStart(2, '0') + "</b></span> day";

    $("#elapseClockDate").html(timeToShow);
}

function timeElapseTime(dateDiff) {
    timeToShow = ""
    timeToShow += "<span class=\"digit\"><b>" + String(dateDiff.hours).padStart(2, '0') + "</b></span> hr ";
    timeToShow += "<span class=\"digit\"><b>" + String(dateDiff.minutes).padStart(2, '0') + "</b></span> min ";
    timeToShow += "<span class=\"digit\"><b>" + String(dateDiff.seconds).padStart(2, '0') + "</b></span> sec";

    $("#elapseClockTime").html(timeToShow);
}

function showMessages(offsetX, offsetY, heartWidth) {
    $('#messages').fadeIn(1000);
    $('#elapseClockDate').fadeIn(1000);
    $('#elapseClockTime').fadeIn(1000);
    // $('#willYouMarryMe').fadeIn(0);
    // $('#willYouMarryMe').delay(1000).fadeTo(3000, 1);
    $('#achieve').fadeIn(1000);
    $('#loveLetter').fadeIn(1000);
}

function adjustWordsPosition(offsetX, offsetY, heartWidth) {
    var $words = $('#words');
    $words.css("width", heartWidth);
    $words.css("position", "absolute");
    $words.css("top", "35%");
    // $words.css("top", "50%");
    // $words.css("transform", "translateY(-100%)");
    // $words.addClass("pt5");
    // $words.css("top", "8rem");
}

function processAchievement(year_diff){
    if (year_diff > 0) {
        var elemt = periodic_table.elements[year_diff - 1];
        // round mass to four decimals at most
        var mass = Math.round(elemt.atomic_mass * 10000) / 10000;

        headerDetail = elemt.number + " &nbsp " + mass;
        bodyDetail = "<strong>" + elemt.symbol + "</strong>";
        footerDetail = elemt.name;
        $("#achieveHeader").html(headerDetail);
        $("#achieveBody").html(bodyDetail);
        $("#achieveFooter").html(footerDetail);
    }
}
