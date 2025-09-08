// /page/main.js
$(function () {
  function loadPage(url, $link) {
    if (!url) return;

    $("#pageContent").load(url, function (resp, status) {
      if (status === "error") {
        $("#pageContent").html("<div class='alert alert-danger'>โหลดเนื้อหาไม่สำเร็จ</div>");
      }
    });

    // toggle active menu
    $(".header-center .nav-link").removeClass("active link-secondary").addClass("link-dark");
    if ($link) {
      $link.addClass("active link-secondary").removeClass("link-dark");
    }
  }

  // เมื่อคลิกเมนู
  $(".header-center").on("click", ".nav-link", function (e) {
    e.preventDefault();
    const url = $(this).data("page");
    loadPage(url, $(this));
  });

  // โหลดหน้าแรก (Attendance)
  const $first = $(".nav-link").first();
  loadPage($first.data("page"), $first);
});
