;
(function($) {
	$.fn.clickOtherHide = function() {
		var $this = this;// 注意this在这后是否被解绑
		$(document).on("click", function(e) {
			// 判断点击的是否为时间控件
			var tat = $(e.target);
			var k = tat.parents("div.Zebra_DatePicker").length;
			k = k + tat.parents("#anode-avatar-modal").length;
			k = k + tat.parents("#bigAutocompleteContent").length;
			k = k + tat.parents("#bigMainAutocompleteContent").length;
			k = k + tat.parents(".modalbox").length;
			var $modalbox = $(".modalbox");
			if($modalbox.is(tat)){
				stopPropagation(e);
			} else if (tat.parents($this.selector).length > 0) {
				stopPropagation(e);
			} else if ($this.is(tat)) {
				stopPropagation(e);
			} else if (k && k > 0) {
				stopPropagation(e);
			} else {
				$this.css('display', 'none');
			}
		});
		function stopPropagation(e) {
			if (e.stopPropagation)
				e.stopPropagation();
			else
				e.cancelBubble = true;
		}
	};
})(jQuery);