var timer_slider;

function apply_setup(){
	location.reload();
}

function toggle_nodes0(type, bShow){
	var nodes = $('.circle[type="' + type + '"]');
	var opacity = "1.0";
	if(!bShow){opacity = "0.1";}
	
	nodes.css("opacity", opacity);
	for(var i = 0; i < nodes.length; i++){
		var node = nodes[i];
		var id = node.__data__.id;
		var lines = $('path[class="line lineshow"]');

		lines.each(function(idx, line){
			if(line.__data__.source.id==id || line.__data__.target.id==id){
				line.style.setProperty("opacity", opacity);
			}
		});
		var linetexts = $('text[class="linetext linetextshow"]');
		linetexts.each(function(idx, linetext){
			if(linetext.__data__.source.id==id || linetext.__data__.target.id==id){
				linetext.style.setProperty("opacity", opacity);
			}
		});
		var nodetexts = $('text[class~="nodetext"]');
		nodetexts.each(function(idx, nodetext){
			if(nodetext.__data__.id==id){
				nodetext.style.setProperty("opacity", opacity);
			}
		});
	}
}
function toggle_nodes(type, bShow){
	var nodes = $('.circle[type="' + type + '"]');
	var opacity = "1.0";
	if(!bShow){opacity = "0.1";}
	
	nodes.css("opacity", opacity);
	for(var i = 0; i < nodes.length; i++){
		var node = nodes[i];
		var id = node.__data__.id;
		var lines = $('path[class="line lineshow"]');
		
		lines.each(function(idx, line){
			if(bShow){
				//console.log(line,bShow);
				var sid = d3.select(this).attr("sourceId");
				var tid = d3.select(this).attr("targetId");
				var s_node = $(".circle[entityid='"+ sid +"']").css("opacity");
				var t_node = $(".circle[entityid='"+ tid +"']").css("opacity");
				if(s_node == 1.0 && t_node == 1.0){
					line.style.setProperty("stroke-opacity", opacity);
				}
			}else{
				//console.log(line,bShow);
				if(line.__data__.source.id==id || line.__data__.target.id==id){
					line.style.setProperty("stroke-opacity", opacity);
				}
			}
		});
		var linetexts = $('text[class="linetext linetextshow"]');
		linetexts.each(function(idx, linetext){
			if(bShow){
				var sid = d3.select(this).attr("sourceId");
				var tid = d3.select(this).attr("targetId");
				var s_node = $(".circle[entityid='"+ sid +"']").css("opacity");
				var t_node = $(".circle[entityid='"+ tid +"']").css("opacity");
				if(s_node == 1.0 && t_node == 1.0){
					linetext.style.setProperty("opacity", opacity);
				}
			}else{
				if(linetext.__data__.source.id==id || linetext.__data__.target.id==id){
					linetext.style.setProperty("opacity", opacity);
				}
			}
		});
		var nodetexts = $('text[class~="nodetext"]');
		nodetexts.each(function(idx, nodetext){
			if(nodetext.__data__.id==id){
				nodetext.style.setProperty("opacity", opacity);
			}
		});
	}
}
function d3_svg(data) {
	//消息通知
	var msg = '';
	if(1 < maxDist){
		msg = '发现实体扩线设置，关联图将进行 <b>' + maxDist + '</b> 层扩线.<br/>';
	}
	if(0 < maxentity && ck && ck == "1"){
		msg += '关联图中最多可显示 <b>' + maxentity + '</b> 个实体.';
	}
	if('' != msg){
		$.Notification.autoHideNotify(
				'warning', 
				'bottom right', 
				'关联分析', 
				msg
		);
	}

	$(".js_doc").attr("disabled", true);
	$(".doc_filter").hide();//隐藏文档筛选列表
	//加载底部echarts图的容器
	$('#echarts_div').load("page/analytic/index_echarts_div.html",function(d){
		chart_page(data);
	});
    //chart_page(data);//加载echarts图数据
    $("#relational_graph").html("");
    var w =  $(".index_center")[0].clientWidth;
    var h =  $(".index_center")[0].clientHeight;
    var width = w;
    var height = h;
    var img_w = 48;
    var img_h = 48;
    var node_w = 38;
    var node_h = 38;
    var r = 16;
    var text_dx = -30;
    var text_dy = 10;
    var tipOnOff = false;
    var imgOnOff = false;
    //tooltip开关
    var key = false;
    // 用于标记是否按下了Ctrl键
    var add_relation = false;
    // 拖动建关系开关
    // mouse event vars
    var svg = null;
    var force = null;
    
    var nodes_circle = null
    var nodes_img = null
    , node = null
    , edges_line = null;
    var edges_text = null;
    var nodes_text = null;
    //标签和连线 以及连线分组
    var marker = null;
	var g = null; 
	var setNum = 3; //关系连线超过 多少条时 只能显示五条
	var newEdgesshow = []; //超过setNum的关系连线时 需要显示的数据
	var newEdgeshide = []; //超过setNum的关系连线时 需要隐藏的数据
		
    var selected_node = null
      , selected_link = null
      , mousedown_link = null
      , mousedown_node = null
      , mouseup_node = null ;
    // 添加关系时的链接线
    var drag_line = null ;
    var root = null ;
    
    //缩放
    var currentOffset = {
    		x : 0,
    		y : 0
    	};
    var currentZoom = 1;
   
    if (data) {
        if (data.hasOwnProperty("d3data")) {
            root = data.d3data;
			$.Notification.autoHideNotify(
		    		'info', 
		    		'bottom right', 
		    		'分析完成', 
		    		'知识实体 <b>' + root.nodes.length + '</b> 个, 关联关系 <b>' + root.edges.length + '</b> 条. <br/> 关联图中所有知识实体涉及文档数量为 <b>' + data.docs.length + '</b> 篇.'
		    		);
        } else {
            window.parent.alert("暂无分析数据.....");
        }
    }
    
    //根据root.edges的关系进行分组编号
    arrGrop(root.edges);
    
    // 添加键盘事件，用于建立关系，
    d3.select(window).on("keydown", keydown);
	var trc = ['<div class="btn_list">',
	             '<div class="ion-plus-round" data-target="add_node" title="添加节点" data-toggle="tooltip" data-placement="right"></div>',
	             '<div class="ion-fork-repo add_relation" title="鼠标拖动创建关系" id="add_relation" data-check="false" data-toggle="tooltip" data-placement="right"></div>',
	             '<div class="ion-ionic" title="去掉独立节点" id="independent_node" data-toggle="tooltip" data-placement="right"></div>',// 去掉独立节点
	            /* '<div class="ion-help-circled" title="提示框" id="save"></div>',// 显示提示框*/
             	 '<div class="ion-edit tip_switch" title="显示实体OR关系编辑框" id="tip_switch" data-check="false" data-toggle="tooltip" data-placement="right"></div>',
             	 '<div class="ion-image img_switch" title="显示实体头像" id="img_switch" data-check="false" data-toggle="tooltip" data-placement="right"></div>',
             	 '<div class="ion-person check_show_person" title="隐藏人物实体" id="check_show_person" data-check="true" data-toggle="tooltip" data-placement="right"></div>',
             	 '<div class="ion-ios-world-outline check_show_org" title="隐藏组织实体" id="check_show_org" data-check="true" data-toggle="tooltip" data-placement="right"></div>',
             	 '<div class="ion-ios-bolt check_show_event" title="隐藏事件实体" id="check_show_event" data-check="true" data-toggle="tooltip" data-placement="right"></div>',
             	 '<div class="full ion-arrow-expand" title="全屏" data-toggle="tooltip" data-placement="right"></div>',// 全屏
             	 '<div class="nofull ion-arrow-shrink" title="退出全屏" data-target="" data-method="nofull" style="display:none;" data-toggle="tooltip" data-placement="right"></div>',// 取消全屏
             	 '<div class="ion-camera" title="保存图片" id="save" data-toggle="tooltip" data-placement="right"></div>',// 保存图片
  	             '<div class="ion-social-rss-outline seting" title="扩线层级"></div>',
         		 '</div>',
	          '</div>',
	          //添加节点
	           '<div class="box add_node add_node_con" id="add-crop-avatar">',
	           	 '<p class="add_node_box_title">添加实体节点</p>',
	             '<p class="add_node_name">' ,
		             /*'<label>名称：</label>' ,*/
		             '<span><input type="text" id="node_name" placeholder="输入实体名称..." /><i class="ion-search"></i></span>' ,
	             '</p>',
	             '<p class="add-error-info"></p>',
	             '<div class="add_node_img" id="add-avatar-view" style="display:none;">',
		            /* '<label>上传头像：</label>' ,*/
		             '<div class="add_img_box avatar-preview"><img src="" /></div>' ,
	             '</div>',
	             '<p class="add-entity-btn"></p>',
	             '<p class="entity-has"></p>',
               '<p class="add_btns"><a class="entity_info" href="javascript:;">详细信息&nbsp;<i class="glyphicon glyphicon-eye-open"></i></a><a class="close_btn" href="javascript:;">取消</a><a class="add_btn" href="javascript:;">确定</a></p>',
             '</div>',
             //设置
	           '<div class="box seting_box" id="">',
	            '<div>',
	             /*'<div class="tip_switch switch">' ,
		             '<div class="name_long">显示实体/关系编辑框</div>' ,
	             	 '<div class="onoffswitch tip">',
             			'<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="tip_switch">',
             			'<label class="onoffswitch-label" for="tip_switch"></label>',
             		 '</div>',
		             '<label class="tip ion-android-radio-button-off" data-value="1">显示</label>',
		             '<label class="tip ion-android-radio-button-on" data-value="0">不显示</label>' ,
	             '</div>',*/
	             /*'<div class="img_switch switch">' ,
	             '<div class="name_long">显示实体头像</div>' ,
             	 '<div class="onoffswitch tip">',
      			    '<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="img_switch">',
      			    '<label class="onoffswitch-label" for="img_switch"></label>',
      		    '</div>',
	             
	             '<label class="img ion-android-radio-button-off" data-value="1">显示</label>' ,
	             '<label class="img ion-android-radio-button-on" data-value="0">不显示</label>',
	             '</div>',*/
	            /* '<div class="add_relation switch">' ,
		             '<div class="name_long">鼠标拖动创建关系</div>',
	             	 '<div class="onoffswitch tip">',
	       			    '<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="add_relation">',
	       			    '<label class="onoffswitch-label" for="add_relation"></label>',
	       		    '</div>',
                    '<label class="ion-android-checkbox-outline-blank" data-value="1">点击节点并拖动</label>' ,
	             '</div>',*/
	             /*'<div class="slt_entity_type">' ,
	             	'<div class="name">显示实体：</div>' ,
	             	'<div style="display:inline-block; width:165px;">',
	             		'<div class="multisetting">',
	             			'<label class="tip" for="check_show_person">人物</label>',
		             		'<div class="onoffswitch tip">',
		             			'<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="check_show_person" checked>',
		             			'<label class="onoffswitch-label" for="check_show_person"></label>',
		             		'</div>',
	             		'</div>',
	             		'<div class="multisetting">',
	             			'<label class="tip" for="check_show_org">组织</label>',
		             		'<div class="onoffswitch tip">',
		             			'<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="check_show_org" checked>',
		             			'<label class="onoffswitch-label" for="check_show_org"></label>',
		             		'</div>',
	             		'</div>',
	             		'<div class="multisetting">',
	             			'<label class="tip" for="check_show_event">事件</label>',
		             		'<div class="onoffswitch tip">',
		             			'<input type="checkbox" name="onoffswitch" class="onoffswitch-checkbox" id="check_show_event" checked>',
		             			'<label class="onoffswitch-label" for="check_show_event"></label>',
		             		'</div>',
	             		'</div>',
	             	'</div>',
	             '</div>',*/
	             '<div class="set_broaden_degree clearfix" style="padding-bottom: 5px;padding-right: 14px;">' ,
	             	'<div class="name">扩线层级：</div>' ,
	             	'<div style="display:inline-block;">',
	             		'<div style="margin-left:10px; display:inline-block; width:100px" id="slider-broaden-degree"></div>',
	             		'<label id="amount" style="margin-left:16px; border:0; color:#f6931f; font-weight:bold;"></label>',
	             		'<label> 层</label>',
	             	'</div>',
	             	'<button class="btn btn-xs btn-primary pull-right" id="submit_degree" style="min-width: 40px;">确定</button>',
	             '</div>',
	             '<div class="set_max_entity" style="border-bottom: 0px;">' ,
	             	'<div class="name">实体数量：</div>' ,
	             	'<div style="display:inline-block;">',
	             		'<label style="display:inline-block;">最多显示 </label>',
	             		'<input id="maxentity" type="number" style="display:inline-block; width: 64px; margin:0px 5px; border:1px solid #ccc; color:#f6931f; font-weight:bold;" value="0"></input>',
	             		'<label style="display:inline-block;"> 个</label>',
	             	'</div>',
	             '</div>',
	           '</div>',
	             /*'<div class="go" style="border-bottom: 0px;">' ,
	             	'<div class="name"></div>' ,
	             	'<div style="float:right;">',
	             		'<a href="javascript:apply_setup();" class="btn">',
	             			'<i class="fa fa-refresh" style="color:#ffffff"></i>应用',
	             		'</a>',
	             	'</div>',
	             '</div>',*/
             ].join('');
	
    // 右上角【工具箱】
    var toolbox = d3.select("#relational_graph").append('div').attr("class", "toolbox").html(trc);
    //提示插件
    $("[data-toggle='tooltip']").tooltip();
	/*if(!ck || '1' != ck){
		$(".set_max_entity")[0].remove();
		$("#independent_node").remove();
		
	}*/
    // 工具按钮的点击事件
    $(".btn_list .ion-plus-round").on("click", function() {
        $('.add-error-info').html('');
        $(".toolbox .box:visible").hide();
        $(".toolbox .add_node").clickOtherHide(add_node_hide);
        $(".toolbox .add_node").show();
        function add_node_hide(){
        	$(".close_btn").click();
        }
        $(".toolbox .add_node").show();
        return false;
    });
    
    
    //人物实体点击隐藏
    $("#check_show_person").click(function(){
    	if($(this).attr("data-check")=="false"){
    		toggle_nodes(1, true);
    		$(this).attr("data-check",true);
    		$(this).removeClass("checked");
    		$(this).attr("data-original-title","隐藏人物实体");
    		$('#resolved').find('path').attr("fill","#003c71");
    		$('#resolved2').find('path').attr("fill","#003c71");
    		$('#resolved3').find('path').attr("fill","#003c71");
    	}else{
    		toggle_nodes(1, false);
    		$(this).attr("data-check",false);
    		$(this).addClass("checked");
    		$(this).attr("data-original-title","显示人物实体");
    		$('#resolved').find('path').attr("fill","rgba(0,60,113,0.1)");
    		$('#resolved2').find('path').attr("fill","rgba(0,60,113,0.1)");
    		$('#resolved3').find('path').attr("fill","rgba(0,60,113,0.1)");
    	}
    	
    });
    $("#check_show_org").click(function(){
    	if($(this).attr("data-check")=="false"){
    		toggle_nodes(2, true);
    		$(this).attr("data-check",true);
    		$(this).removeClass("checked");
    		$(this).attr("data-original-title","隐藏组织实体");
    		$('#resolved2').find('path').attr("fill","#003c71");
    		$('#resolved4').find('path').attr("fill","#003c71");
    		$('#resolved5').find('path').attr("fill","#003c71");
    	}else{
    		toggle_nodes(2, false);
    		$(this).attr("data-check",false);
    		$(this).addClass("checked");
    		$(this).attr("data-original-title","显示组织实体");
    		$('#resolved2').find('path').attr("fill","rgba(0,60,113,0.1)");
    		$('#resolved4').find('path').attr("fill","rgba(0,60,113,0.1)");
    		$('#resolved5').find('path').attr("fill","rgba(0,60,113,0.1)");
    	}
    });
    $("#check_show_event").click(function(){
    	if($(this).attr("data-check")=="false"){
    		toggle_nodes(6, true);
    		$("[data-toggle='tooltip']").tooltip();
    		$(this).attr("data-check",true);
    		$(this).removeClass("checked");
    		$(this).attr("data-original-title","隐藏事件实体");
    		$('#resolved3').find('path').attr("fill","#003c71");
    		$('#resolved5').find('path').attr("fill","#003c71");
    		$('#resolved6').find('path').attr("fill","#003c71");
    	}else{
    		toggle_nodes(6, false);
    		$("[data-toggle='tooltip']").tooltip();
    		$(this).attr("data-check",false);
    		$(this).addClass("checked");
    		$(this).attr("data-original-title","显示事件实体");
    		$('#resolved3').find('path').attr("fill","rgba(0,60,113,0.1)");
    		$('#resolved5').find('path').attr("fill","rgba(0,60,113,0.1)");
    		$('#resolved6').find('path').attr("fill","rgba(0,60,113,0.1)");
    	}
    });
    $( "#slider-broaden-degree" ).slider(
    		{
    			range: "max",
    			min: 1,
    			max: 3,
    			value: $.cookie("maxdist") ? $.cookie("maxdist") : 1,
    			slide: function( event, ui ) {
    				if (timer_slider) {
    		            clearTimeout(timer_slider);
    		        }
    				timer_slider = setTimeout(function() {
    		            $( "#amount" ).text( ui.value );
    		            $.cookie("maxdist", ui.value);
    		            maxDist = ui.value;
    		            //apply_setup();
    		        }, 500);
    			}
    	    });
    $("#submit_degree").click(function(){
    	
    	doLoadData(1);
    });
    $("#amount" ).text( $( "#slider-broaden-degree" ).slider( "value" ) );
	$("#maxentity").val($.cookie("maxentity"));
    $( "#maxentity" ).bind('input', function () {
    	$.cookie("maxentity", $(this).val());
    	maxentity = $(this).val();
    });
    $('#maxentity').keydown(function(e){
         if(e.keyCode==13){
 			//apply_setup();
        	 doLoadData(1);
 		}
	});
    // 【添加节点】的相关事件-----------开始-------------》》》》》》》》
    //搜索实体
    var K = false;//标记图里是否有该实体
    $("#node_name").bigAutocomplete({
		//width : 0,
		data : null,
		url : "/common/qr?cache=false",
		callback : function(data) {
			$(".entity-has").hide().html("");
			$(".add-entity-btn").attr("data-name","").hide();
			root.nodes.forEach(function(d,i){
				if(d.id == data.entityId){
					K = true;
				}
			});
			if(!K){
				$("#node_name").attr("data-type",data.type);
				$("#node_name").attr("data-entityid",data.entityId);
				$("#add-avatar-view").css("display","block");
				$(".add_img_box>img").attr("src","/common/entity_image?type=" + data.type +"&entityid=" + data.entityId);
				$(".add_btns .entity_info").show().attr("href","javascript:svg_entity_info("+data.type+",'"+data.entityId+"');");
				$(".add_btns .add_btn").show();
			}else{
				$(".entity-has").show().html("节点<span>["+ data.word +"]</span>已存在！");
			}
		},
		changeInputCallback : function(keyword){
			K = false;
			if(!keyword || keyword == ""){
				$(".add-entity-btn").attr("data-name","").hide();
			}
			$(".entity-has").hide().html("");
			$("#node_name").attr("data-entityid","");
			$("#node_name").attr("data-type","");
			$("#add-avatar-view").css("display","none");
			$(".add_img_box>img").attr("src","");
			$(".add_btns .entity_info").hide().attr("href","javascript:;");
			$(".add_btns .add_btn").hide();
		},
		resultCallback :function(data){
			$(".add-entity-btn").attr("data-name","").hide();
			var HRN = false;
			var KN = false;
			var entid = $("#node_name").attr("data-entityid");
			var name = $("#node_name").val().trim();
			if(name && name!=""){
				if(data && data.length>0){
					data.forEach(function(d,i){
						if(d && d.word== name){
							HRN = true;
						}
					});
				}
				root.nodes.forEach(function(d,i){
					if(d.name == name){
						KN = true;
					}
				});
				if(KN){
					$(".add-entity-btn").html('<span>图中已有实体‘'+ name +'’</span><br/><i class="ion-plus-round"></i>添加同名新实体').attr("data-name",name).show();
				}else if(HRN){
					$(".add-entity-btn").html('<span>已有名为‘'+ name +'’的实体</span><br/> <i class="ion-plus-round"></i>添加同名新实体').attr("data-name",name).show();
				}else{
					$(".add-entity-btn").html('<span>没有实体‘'+ name +'’</span><br/><i class="ion-plus-round"></i>添加新实体').attr("data-name",name).show();
				}
			}
			return;
		}
	});
    //添加图片
/*    $(".add_node .add_img_box").on("click", "img", function() {
        $('.add-error-info').html('');
        $("#anode-avatar-modal").show();
        $("#anode-avatar-modal button.close").on("click", function() {
            $(this).parents("#anode-avatar-modal").hide();
        });
        $("#anode-avatar-modal button.avatar-save").on("click", function() {
            $(this).parents("#anode-avatar-modal").hide();
        });
    });*/
    //添加实体
    $(".add-entity-btn").off("click").on("click",function(){
    	var $this = $(this);
    	$(".modalbox").show().load("page/analytic/add_entity_category.html",function(d){
    	});
    });
    // 确定按钮
    $(".add_btn").off("click").on("click", function() {
        var name = $("#node_name").val();
        var idd = $("#node_name").attr("data-entityid");
        var type = $("#node_name").attr("data-type");
        var src = $(".add_img_box>img").attr("src");
        if (name && name.trim() != "") {
            if (src) {
                var new_node = {
                	"id": idd,
                    "name": name,
                    "image": src,
                    "type":type
                };
                $(".add_node").removeClass("add_show").addClass("add_hide");
                root.nodes.push(new_node);
                redraw();
                $(".close_btn").click();
                // 关闭
                $("#inputImage").val("");
            } else {
                $('.add-error-info').html('请上传头像');
            }
            $("#node_name").val("");
            $(".add-entity-btn").attr("data-name","").html("").hide();
			$(".entity-has").hide().html("");
			$("#node_name").attr("data-entityid","");
			$("#add-avatar-view").css("display","none");
			$(".add_img_box>img").attr("src","");
			$(".add_btns .entity_info").hide().attr("href","javascript:;");
			$(".add_btns .add_btn").hide();
			$(".check_show_person.checked").click();
			$(".check_show_org.checked").click();
			$(".check_show_event.checked").click();
        } else {
            $('.add-error-info').html('实体名称不能为空');
            $("#node_name").focus();
        }
        return false;
    });
    // 取消按钮
    $(".close_btn").off("click").on("click", function() {
        $("#node_name").val("");
        $("#node_name").css("border", "1px solid #ccc");
        $(".add-entity-btn").html("");
        $(".add_img_box").attr("src", "");
		$("#add-avatar-view").css("display","none");
		$(".add_img_box>img").attr("src","");
		$(".entity-has").html("");
		$(".add_btns .entity_info").hide().attr("href","javascript:;");
        $(".toolbox .add_node").hide();
        return false;
    });
    // 【添加节点】的相关事件-----------结束-------------《《《《《《《
    // 【全屏事件】-----------------开始---------------》》》》》》
    $(".full").off("click").on("click", function() {
        // d3.select(".js_doc").style({"position":"fixed","top":"70px","z-index":2});
        full();
        $(window).off("resize").on("resize", function() {
            // 当浏览器大小变化时
            full();
        });
    });
    function full() {
        $(".full").css("display", "none");
        $(".nofull").css("display", "block");
        height = $(window).height()-60;
        width = $(window).width();
        svg.attr("width", width).attr("height", height).style({
            "width": width,
            "height": height
        }).classed("svgfull", true);
        force.size([width, height]).linkDistance(300);
        toolbox.classed("svgfull-toolbox", true);
        legend.classed("svgfull-legend", true);
        //arrGrop(root.edges);
        redraw();
    }
    // 【全屏事件】-----------------结束---------------《《《《《《《《
    // 【取消全屏】-----------------开始----------------》》》》》》》》
    $(".nofull").off("click").on("click", function() {
        $(window).off("resize");
        width = w;
        height = h;
        // d3.select(".js_doc").style({"position":"absolute","top":"0px","z-index":2});
        $(this).css("display", "none");
        $(".full").css("display", "block");
        svg.attr("width", width).attr("height", height).style({
            "width": width,
            "height": height
        }).classed("svgfull", false);
        force.size([width, height]).linkDistance(200);
        toolbox.classed("svgfull-toolbox", false);
        legend.classed("svgfull-legend", false);
        redraw();
    });
    // 【取消全屏】-----------------结束----------------《《《《《《《《《
    // 【导出图片】-----------------开始---------------》》》》》》》》》》
    d3.select("#save").on("click", function() {
    	var svg = $("svg")[0];
    	var saveOptions = {
    		    selectorRemap: function(s) {return s.replace('#relational_graph ', '')}
    	  }
    	 saveSvgAsPng(svg, 'capture-' + (new Date().getTime()) + '.png', saveOptions);
        //var html = d3.select("svg").attr("version", 1.1).attr("xmlns", "http://www.w3.org/2000/svg").node().parentNode.innerHTML;
        /*
		 * console.log(html); console.log(btoa(encodeURIComponent(html))) var
		 * imgsrc = 'data:image/svg+xml;base64,'+
		 * btoa(encodeURIComponent(html)); var img = '<img src="'+imgsrc+'">';
		 * d3.select("#svgdataurl").html(img);
		 */
       // submit_download_form("svg");
    });
    // 【导出图片】-----------------结束---------------《《《《《《《《《《
    // 【去掉独立节点】-----------------开始------------》》》》》》》》》》
    var isFilter = false;
    $("#independent_node").on("click",function(){
    	$(".js_doc").attr("disabled", true);
    	$(".doc_filter").hide();//隐藏文档筛选列表
    	if(!isFilter){
    	var new_nodes = [];
    	root.edges.forEach(function(d,i){
    		var s = new_nodes.indexOf(d.source);
    		if(s<0){
    			new_nodes.push(d.source);
    		}
    		var t = new_nodes.indexOf(d.target);
    		if(t<0){
    			new_nodes.push(d.target);
    		}
    	});
    	var entitys = [];
    	new_nodes.forEach(function(d,i){
    		var enty = {};
    		enty.id=d.id;
    		enty.type=d.type;
    		entitys.push(enty);
    	});
    	var docs__ = $.cookie(dockey);
    	if(entitys && entitys.length>0){
	    	$.post("/analytic/statisticGraph",{docs:docs__,entities:JSON.stringify(entitys)},function(data){
				if (data.hasOwnProperty("center")) {
					entity_info_base_info(data.center.id, data.center.type);
					entity_info(data.center.id, data.center.type);
					relate_doc(data.center.id, data.center.type);
				}
				isFilter = true;
		    	root.nodes = new_nodes;
		    	redraw();//更新关系图
		    	//$("#independent_node").off("click").css({"color":"#a5a5a5","cursor":"not-allowed"});
				filter_docs(data.docs,data.docs_core);// 文档筛选
				$('#echarts_div').load("page/analytic/index_echarts_div.html",function(d){
					chart_page(data);
				});
	    	});
    	}else{
    		isFilter = true;
	    	root.nodes = new_nodes;
	    	redraw();//更新关系图
            $.Notification.autoHideNotify(
                    'warning', 
                    'right center', 
                    '去掉独立节点', 
                    '没有关联关系'
                    );
    	}
    	$(".js_doc").attr("disabled", null);
      }else{
    	  location.reload();//刷新页面
      }
    });
    // 【去掉独立节点】-----------------结束------------《《《《《《《《《
    // 【设置】--------------------开始---------------》》》》》》》》》》
    var leave_seting_time = 0;
    $(".toolbox .seting").on("click", function() {
        $(".toolbox .box:visible").hide();
       //$(".toolbox .seting_box").clickOtherHide();
        $(".toolbox .seting_box").show();
        $(this).addClass("hover");
        return false;
    }).on("mouseleave",function(){
    	clearTimeout(leave_seting_time);
    	leave_seting_time = setTimeout(function(){
    		$(".toolbox .seting").removeClass("hover");
    		$(".toolbox .seting_box").hide();
    	},800);
     return false;
   });
    $(".toolbox .seting_box").on("mouseover",function(){
    	clearTimeout(leave_seting_time);
    	$(".toolbox .seting").addClass("hover");
    	$(".toolbox .seting_box").show();
        return false;
    }).on("mouseleave",function(){
    	leave_seting_time = setTimeout(function(){
    		$(".toolbox .seting").removeClass("hover");
    		$(".toolbox .seting_box").hide();
    	},800);
        return false;
    });
    
    //设置框的相关事件
    //提示框开关
    $("#tip_switch").click(function(){
    	if($(this).attr("data-check")=="false"){
    		tipOnOff = true;
    		$(this).addClass("checked");
    	}else{
    		tipOnOff = false;
    		$(this).removeClass("checked");
    	}
    	$(this).attr("data-check",tipOnOff);
    });
    //这里被弃用了
    $(".toolbox .seting_box .tip_switch label.tip").off("click").on("click", function() {
        $(this).parent().find(".tip").removeClass('ion-android-radio-button-on').addClass('ion-android-radio-button-off');
        $(this).removeClass('ion-android-radio-button-off').addClass('ion-android-radio-button-on');
        var val = $(this).parent().find(".ion-android-radio-button-on").attr("data-value");
        if (val && val == 1) {
            tipOnOff = true;
        } else {
            tipOnOff = false;
        }
        //$(".toolbox .seting").click();
    });
    //图片显示开关
    $("#img_switch").click(function(){
    	if($(this).attr("data-check")=="false"){
    		imgOnOff = true;
    		$(this).addClass("checked");
    	}else{
    		imgOnOff = false;
    		$(this).removeClass("checked");
    	}
    	$(this).attr("data-check",imgOnOff);
    	redraw();
    	showOrHide();
    });
    //根据工具按钮判断显示节点还是隐藏
    function showOrHide(){
    	if($(".check_show_person").attr("data-check")=="false"){
    		toggle_nodes(1, false);
    	}
    	if($(".check_show_org").attr("data-check")=="false"){
    		toggle_nodes(2, false);
    	}
    	if($(".check_show_event").attr("data-check")=="false"){
    		toggle_nodes(6, false);
    	}
    }
    //这里被弃用了
    $(".toolbox .seting_box .img_switch label.img").off("click").on("click", function() {
    	$(this).parent().find(".img").removeClass('ion-android-radio-button-on').addClass('ion-android-radio-button-off');
    	$(this).removeClass('ion-android-radio-button-off').addClass('ion-android-radio-button-on');
    	var val = $(this).parent().find(".ion-android-radio-button-on").attr("data-value");
    	if (val && val == 1) {
    		imgOnOff = true;
    	} else {
    		imgOnOff = false;
    	}
    	 redraw();
    	//$(".toolbox .seting").click();
    });
    //添加关系开关
    $("#add_relation").click(function(){
    	if($(this).attr("data-check")=="false"){
    		add_relation = true;
    		$(this).addClass("checked");
    	}else{
    		add_relation = false;
    		$(this).removeClass("checked");
    	}
    	$(this).attr("data-check",add_relation);
    });
    //这里被弃用了
    var t = 0;
    $(".toolbox .seting_box .add_relation label").off("click").on("click", function() {
        if (t % 2 == 0) {
            $(this).removeClass('ion-android-checkbox-outline-blank').addClass("ion-android-checkbox-outline");
            add_relation = true;
        } else {
            $(this).addClass('ion-android-checkbox-outline-blank').removeClass("ion-android-checkbox-outline");
            add_relation = false;
        }
        t++;
        //$(".toolbox .seting").click();
    });
    // 【设置】--------------------结束---------------《《《《《《《《《《
    // 添加一个提示框
    var tooltip = d3.select("#relational_graph").append("div").attr("class", "tooltip");
    //添加图例
    var legend = d3.select("#relational_graph").append("div").attr("class", "legend");
    var leg = ['<div><table>',
               '<tr><td style="font-size:14px; font-weight:bold; color:#FFF; background-color:#f29F00;">图例</td><td>人物</td><td>组织</td><td>事件</td></tr>',
               '<tr><td style="background-color:#ea443f;">已确认</td><td><img src="/images/rw_ok.png" /></td><td><img src="/images/zz_ok.png" /></td><td><img src="/images/sj_ok.png" /></td></tr>',
               '<tr><td style="background-color:#9ad01a;">未确认</td><td><img src="/images/rw.png" /></td><td><img src="/images/zz.png" /></td><td><img src="/images/sj.png" /></td></tr>',
               '</table></div>'].join('');
    legend.html(leg);
    // add link
    /*
	 * var link1 = { source : 0, target : 0, id:"drag_line", x1:0, y1:0, x2:0,
	 * y2:0 }; root.edges.push(link1);
	 */
    var node_drag = d3.behavior.drag().on("dragstart", dragstart).on("drag", dragmove).on("dragend", dragend);
    svg = d3.select("#relational_graph").append("svg").style("background", "#5189c5").attr("width", width).attr("height", height).on("mousemove", mousemove).on("mouseup", mouseup);
    d3.select("body").on("mouseup", mouseup);
    svg.on("click", function() {
        window.parent.dispalyMenu();
        window.parent.displayDocFilter();
    });
    //d3 install
    force = d3.layout.force().nodes(root.nodes).links(root.edges).size([width, height]).linkDistance(200).charge(-800).start();
    
  //定义缩放函数  
    //var zoomScale = d3.behavior.zoom()  
    //        .scaleExtent([1,10])//用于设置最小和最大的缩放比例  
            //.on("zoom",zoomed)  
    
    var zoomScale = d3.scale.linear().clamp(true);
    //绘制  
    var grpParent = svg.append("g")
            .attr("class","grpParent")
           // .call(zoomScale)
     svg.call(d3.behavior.zoom().on("zoom", doZoom));
	 svg.call(d3.behavior.drag().on("drag", dragMove));    
     svg.on("dblclick.zoom", null);//取消双击放大，注意要放在call("zoom")之后
     
    /*  原语法
    function zoomed(){  
    	grpParent.attr("transform","translate("+d3.event.translate+")scale("+d3.event.scale+")")  
    }
    */
    arrGrop(root.edges);
    redraw();
    
    function markers(id,color){
    	//箭头
  		marker = svg.select('.grpParent').append("marker")
  			//.attr("id", function(d) { return d; })
  			.attr("id", id)
  			.attr("markerUnits","strokeWidth")//设置为strokeWidth箭头会随着线的粗细发生变化
  			.attr("markerUnits","userSpaceOnUse")
  			.attr("viewBox", "0 -5 10 10")//坐标系的区域
  			.attr("refX",function(){
  				return imgOnOff?(img_w-6):node_w-6;
  			 })//箭头坐标
  			.attr("refY", 0)
  			.attr("markerWidth", 8)//标识的大小
  			.attr("markerHeight", 8)
  			.attr("orient", "auto")//绘制方向，可设定为：auto（自动确认方向）和 角度值
  			.attr("stroke-width",2)//箭头宽度
  			.append("path")
  			.attr("d", "M0,-5L10,0L0,5")//箭头的路径
  			.attr('fill',color);//箭头颜色
    }
    
    // ====================《 重新布局 》======================
    function redraw() {
        nodes_circle = svg.selectAll("circle").remove();
        node = svg.selectAll("image").remove();
        edges_line = svg.selectAll("path").remove();
        marker = svg.selectAll("marker").remove();
        g = svg.select('.grpParent').selectAll("g").remove();
        edges_text = svg.selectAll(".linetext").remove();
        nodes_text = svg.selectAll(".nodetext").remove();
        nodes_img = svg.selectAll("defs").remove();
        edges_line = svg.selectAll("path");
        edges_text = svg.selectAll(".linetext");
        nodes_text = svg.selectAll(".nodetext");
        
            //箭头
      		
      		markers("resolved",'#003c71');//1-1
      		markers("resolved2",'#003c71');//1-2
      		markers("resolved3",'#003c71');//1-6
      		markers("resolved4",'#003c71');//2-2
      		markers("resolved5",'#003c71');//2-6
      		markers("resolved6",'#003c71');//6-6
      		
        // ------------1连线---------------
      		
      		/*
        edges_line = edges_line.data(root.edges);
        edges_line.enter().insert("line", "text").classed("line", true).attr("sourceId", function(d) {
            return d.source.id;
        }).attr("targetId", function(d) {
            return d.target.id;
        }).attr("rid", function(d) {
        	 return d.rid;
        }).attr("rids", function(d) {
            var rids = d.rids;
            if (rids) {
            	return JSON.stringify(rids);
            }
        }).text(function(d) {
            return d.relation;
        }).on("mouseover", mouseover_lineOrtext).on("mouseleave", mouseout_hidden_tooltip).on("click", relationClick);
        */
      	    // 创建连接线
      		
      		edges_line = svg.select('.grpParent').append("g").selectAll("path").data(root.edges)
    			.enter().append("path")
    			.attr("class", function(d){return Math.abs(d.linknum)>(setNum+1)/2?"line linehide":"line lineshow"})
    			.attr("id", function(d,i){return 'edgepath'+i;})
    			.attr("sourceId", function(d) {
    				return d.source.id;
    			}).attr("targetId", function(d) {
    				return d.target.id;
    			}).attr("rid", function(d) {
    	        	 return d.rid;
    	        }).attr("rids", function(d) {
    	            var rids = d.rids;
    	            if (rids) {
    	            	return JSON.stringify(rids);
    	            }
    	        }).attr("txts",function(d){
    	        	return  d.relation;
    	        }).text(function(d){
    	        	if(d.linknum == -(setNum+1)/2){
    	        		var k = 0;
    					for(var i=0;i<newEdgeshide.length;i++){
    						if(d.source.id == newEdgeshide[i][0].source.id && d.target.id == newEdgeshide[i][0].target.id){
    							k = newEdgeshide[i].length+1;
    							return  "更多("+ k +")";
    						}else{
    							return d.relation;
    						}
    					}
    					
    				}
    			   return d.relation;
    			}).classed("path_hide",function(d){
    				if(d.num>5){
    					return true;
    				}
    			}).style("fill","none")
    			.attr("marker-end", function(d,i) {
    				var markerNode = root.nodes;
    				var s_id = d.source.id;
    				var t_id = d.target.id;
    				var str = '';
    				var type_array = [];
    				var index=0;
    				$.each(markerNode,function(i,e){
    					if(s_id == e.id || t_id == e.id){
    						type_array[index] = e.type;
    						index++;
    						if(index>=2){
    							return false;
    						}
    					}    
    				});
    				if(type_array[0]==1 && type_array[1]==1){
    					str = "url(#" + "resolved" + ")"; 
    				}else if((type_array[0]==1 && type_array[1]==2) || (type_array[1]==1 && type_array[0]==2)){
    					str = "url(#" + "resolved2" + ")"; 
    				}else if((type_array[0]==1 && type_array[1]==6) || (type_array[1]==1 && type_array[0]==6)){
    					str = "url(#" + "resolved3" + ")"; 
    				}else if(type_array[0]==2 && type_array[1]==2){
    					str = "url(#" + "resolved4" + ")"; 
    				}else if((type_array[0]==2 && type_array[1]==6) || (type_array[1]==2 && type_array[0]==6)){
    					str = "url(#" + "resolved5" + ")"; 
    				}else if(type_array[0]==6 && type_array[1]==6){
    					str = "url(#" + "resolved6" + ")"; 
    				}
    				return str; 
                })//根据箭头标记的id号标记箭头
    			.on("mouseover", mouseover_lineOrtext).on("mouseleave", mouseout_hidden_tooltip)
    			.on("click", relationClick);

      	//--------连线修改过 完毕-----------
      		
        svg.select("#drag_line").remove();
        // line displayed when dragging new nodes
        drag_line = svg.select('.grpParent').insert("line", "text").attr("id", "drag_line").attr("class", "drag_line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 0);
       // drag_line = svg.append("path").attr("id", "drag_line").attr("class", "drag_line").attr('d','M '+0+' '+0+' L '+ 0 +' '+0);
        //alert(drag_line);
        // ----------2连线的文字-----------
        /*
        edges_text = edges_text.data(root.edges);
        if(imgOnOff){
        	edges_text.enter().insert("text", "circle");
        }else{
        	edges_text.enter().insert("text", "circle");
        }
        edges_text.attr("class", "linetext").attr("sourceId", function(d) {
            return d.source.id;
        }).attr("targetId", function(d) {
            return d.target.id;
        }).attr("rid", function(d) {
            return d.rid;
        }).attr("rids", function(d) {
            var rids = d.rids;
            if (rids) {
            	return JSON.stringify(rids);
            }
        }).on("click", relationClick)
        .text(function(d) {
            var rids = d.rids;
            var k = 0;
            if (rids) {
            	k = rids.length;
            }
            return d.relation + "("+ k +")";
        }).on("mouseover", mouseover_lineOrtext).on("mouseleave", mouseout_hidden_tooltip);
        */
        edges_text = svg.select('.grpParent').append("g").selectAll(".linetext").data(root.edges)
		.enter().append("text")
		.attr({ 
//			'class':'linetext',
			'class':  function(d){return Math.abs(d.linknum)>(setNum+1)/2?"linetext linetexthide":"linetext linetextshow"},
			'id':function(d,i){return 'edgepath'+i;},
			'dx':function(d){return currentZoom*Math.sqrt(Math.pow(Math.abs(d.source.x - d.target.x),2)+Math.pow(Math.abs(d.source.y - d.target.y),2))/2 - 16},
			'dy':0
			
		})
		.attr("sourceId", function(d) { return d.source.id;})
		.attr("targetId", function(d) { return d.target.id;})
		.attr("rid", function(d) {
            return d.rid;
        }) 
		.attr("rids", function(d) {
			 var rids = d.rids;
	            if (rids) {
	            	return JSON.stringify(rids);
	            }
		})
		.attr("txts",function(d){
			return d.relation;
		})
       .on("click", relationClick)
	   .on("mouseover", mouseover_lineOrtext)
	   .on("mouseleave", mouseout_hidden_tooltip);

		edges_text.append('textPath')
		.attr('xlink:href',function(d,i) {return '#edgepath'+i})
		.text(function(d){
//			var rids = d.rids;
            var k = 0;
//            if (rids) {
//            	k = rids.length;
//            }
            
			if(d.linknum == -(setNum+1)/2){
				for(var i=0;i<newEdgeshide.length;i++){
					if(d.source.id == newEdgeshide[i][0].source.id && d.target.id == newEdgeshide[i][0].target.id){
						k = newEdgeshide[i].length+1;
						return  "更多("+ k +")";
					}else{
						return d.relation;
					}
				}
				
			}
            return d.relation;
          });
//          .on("click", function(d){alert(d3.select(this));})
//		.on("mouseover", mouseover_lineOrtext).on("mouseleave", mouseout_hidden_tooltip);
        //--------连线文字修改过 完毕-----------
        
        
        // ----------3图片节点------------
        if(imgOnOff){// 有头像
        	nodes_img = svg.select('.grpParent').append("g").selectAll("defs");
            nodes_circle = svg.select('.grpParent').append("g").selectAll("circle");
        	getImageNodeData();
        	force.on("tick", tickImg);
        }else{// 无头像
        	node = svg.select('.grpParent').append("g").selectAll("circle");
        	getNodeData();
        	force.on("tick", tickNode);
        }
        // ------------4图片文字------------
        //nodes_text = nodes_text.data(root.nodes);
        nodes_text = svg.select('.grpParent').append("g").selectAll("text").data(root.nodes);
        nodes_text.enter().insert("text", "circle").attr("class", "nodetext").attr("dx", text_dx).attr("dy", text_dy).attr("sourceId", function(d) {
            return d.id;
        }).text(function(d) {
            if (d.name == data.center.name) {
                name = data.center.name;
            }
            return d.name;
        });
        
/*
 * nodes_circle.exit().remove(); circle.exit().remove();
 */
        if (d3.event) {
            d3.event.preventDefault();
            // prevent browser's default behavior
        }
        // change_node_text_class(svg.selectAll(".nodetext"), name);
        force.start();
    }
    //封装图片节点的数据
    function getImageNodeData() {
        nodes_img = nodes_img.data(root.nodes);
        var defs = nodes_img.enter().insert("defs");
        var pattern = defs.insert("pattern").attr("width", "100%").attr("height", "100%").attr("id",function(d){
        	 return d.id;
        });
        
        pattern.insert("image").attr("width", img_w).attr("height", img_h).attr("xlink:href", function(d) {
            return d.image;
        });
        fill="url(#raduisImage)"
        nodes_circle = nodes_circle.data(root.nodes);
        nodes_circle.enter().insert("circle")
        .attr("width", img_w).attr("height", img_h).attr("class", "circle")// .attr("lowsrc","/images/avator_58.png")
        .attr("xlink:href", function(d) {
            return d.image;
        }).attr("entityid", function(d) {
            return d.id;
        }).attr("name", function(d) {
            return d.name;
        }).attr("type", function(d) {
            return d.type;
        }).attr("r",img_w / 2).attr("fill",function(d){
        	return "url(#"+ d.id +")"
        }).classed("confirm",function(d){
        	if(d.confirm){
        		return true;
        	}else{
        		return false;
        	}
        })
        //.style("border-radius", "50%")
        /*
		 * .on("mouseover",function(d,i){ //显示连接线上的文字
		 * edges_text.style("fill-opacity",function(edge){ if( edge.source === d ||
		 * edge.target === d ){ return 1.0; } }); })
		 * .on("mouseout",function(d,i){ //隐去连接线上的文字
		 * edges_text.style("fill-opacity",function(edge){ if( edge.source === d ||
		 * edge.target === d ){ return 0.0; } }); })
		 */
        .on("dblclick", function(d, i) {
            // 双击事件
            window.open("/analytic?type=" + d.type + "&entityid=" + d.id);
        }).on("click", nodeClick).on("mousedown", mousedown_nodes_img).on("mouseover", mouseover_nodes_img).on("mouseup", mouseup_nodes_img).on("mouseleave", mouseout_hidden_tooltip);//.call(node_drag);
    }
    //封装无头像节点的数据
    function getNodeData() {
    	node = node.data(root.nodes);
    	node.enter().insert("image").attr("width", node_w).attr("height", node_h).attr("class", "circle")
    	.attr("entityid", function(d) {
    		return d.id;
    	}).attr("name", function(d) {
    		return d.name;
    	}).attr("xlink:href", function(d) {
    		if(d.type==1){
        		if(d.confirm){
        			return "/images/rw_ok.png";
        		}else{
        			return "/images/rw.png";
        		}
    		}else if(d.type==2){
        		if(d.confirm){
        			return "/images/zz_ok.png";
        		}else{
        			return "/images/zz.png";
        		}
    		}else{
        		if(d.confirm){
        			return "/images/sj_ok.png";
        		}else{
        			return "/images/sj.png";
        		}
    		}
    	}).attr("type", function(d) {
    		return d.type;
    	})
    	.classed("node", true)
    	.classed("confirm",function(d){
    		if(d.confirm){
    			return true;
    		}else{
    			return false;
    		}
    	})
    	.on("dblclick", function(d, i) {
    		// 双击事件
    		window.open("/analytic?type=" + d.type + "&entityid=" + d.id);
    	}).on("click",nodeClick).on("mousedown", mousedown_nodes_img).on("mouseover", mouseover_nodes_img).on("mouseup", mouseup_nodes_img).on("mouseleave", mouseout_hidden_tooltip).call(node_drag);
    }
    //点击结点
    function nodeClick(d){
        var entity_type = d.type;
        var entity_id = d.id;
        var name = d.name;
        // 隐藏关系相关试图
        $("#rel_all_info").attr("style", "display:none;");
        if(!d3.select(this).classed("selected")){
        	// 改变字体颜色
        	var lsid = d.id;
        	change_style(data.center.name, lsid);
        	
        	d3.selectAll(".circle").classed("selected",false);
        	d3.select(this).classed("selected",true);
        	// 改变节点文字的样式
        	// 仅获取实体基本信息
        	window.parent.entity_info_base_info(entity_id, entity_type, name);
        	// 获取主页面右侧的实体信息
        	window.parent.entity_info(entity_id, entity_type);
        	// 获取实体的关联文档
        	window.parent.relate_doc(entity_id, entity_type);
        }
    }
    //关系的连线或文字点击事件
    function relationClick(d) {
        var lsid = d.source.id;
        var ltid = d.target.id;
        change_style(data.center.name, lsid, ltid);
        // 改变样式
        var sourceId = d3.select(this).attr("sourceId");
        var targetId = d3.select(this).attr("targetId");
//        var rids = d3.select(this).attr("rids");
        var rids = d.rids;
        var relation = d3.select(this).attr("txts");
        var rid = d3.select(this).attr("rid");
        var texts = d3.select(this).text(); //更多
        
        var rel = {}; //默认展开的关系详情
        rel.id = rid;
        rel.name = relation;
//        console.log(newEdgeshide); //所有超过setNum关系线时 展示之前隐藏的数据集合
//        console.log(rids,txts,relation,rel);
        if(texts.slice(0,2) == '更多'){
        	var arrEdges = []; //点击时 当前隐藏的关系数据
        	var ridsEdges = [];
        	var new_rids = [];
//        	console.log(newEdgeshide);
        	$.each(newEdgeshide,function(i,n){
        		if(n[0].source.id == lsid && n[0].target.id == ltid ){
        			arrEdges = n;
        		}
        	});	
        	//把隐藏的数据 转换成 传给后台需要的 数据
        	$.each(arrEdges,function(i,n){
        		var obj = {};
        		obj.id = n.rid;
        		obj.name = n.relation;
        		//console.log(typeof ridsEdges);
        		ridsEdges.push(obj);
        	});	
        	//点击的当前关系和其他隐藏的关系 合并 传到后台
//        	new_rids =JSON.stringify( rids.concat(ridsEdges)); 
        	new_rids =  rids.concat(ridsEdges); 
//        	console.log(new_rids);
			query_rel_info_byrids(new_rids,rel);
        }else{
	        // query_rel_info(sourceId, targetId);//更加from to 查询关系列表
//        	console.log(rids,rel);
        	query_rel_info_byrids(rids,rel)
	        // 根据关系id查询关系列表
        }
    }
    // 鼠标移动到关系连线上或者文字上
    function mouseover_lineOrtext(d) {
    	$(this).attr("cursor","pointer");// 给鼠标换成小手
        if (mousedown_node || !tipOnOff)
            return;
        var $ts = $(this);
        var lsid = d.source.id;
        var lstype = d.source.type;
        var ltid = d.target.id;
        var lttype = d.target.type;
        var relation = d.relation;
        var rid = d.rid;
        var rids = d.rids;
        
        if (!relation) {
            relation = "未定义";
        }
        var dom = "<div class='relation_name'>";
        for(var i in rids){
        	if(rids[i].id==rid){//如果当前名称为什么时
        		dom+= "<a class='active' href='javascript:;'><span data-rid='"+ rids[i].id+"'>"+ relation +"</span></a>";
        		//dom+= "<a class='active' href='javascript:;'><span data-rid='"+ rids[i].id+"'>"+ rids[i].name +"</span></a>";
        	}else{
        		dom+= "<a class='' href='javascript:;'><span data-rid='"+ rids[i].id+"'>"+ rids[i].name +"</span></a>";
        	}
        }
        dom+="</div>";
        var html = '<div class="iline"><em class="left_em"></em><div class="mes_hd mes_lhd">' +dom+ '<h2><span>【关系】 </span><a href="javascript:;" class="ion-edit"></a><input type="text" class="i_linetext" value="' + relation + '" maxlength="20" /></h2>' + '<div class="mes_lbtns"><a class="mes_del btn_s ion-trash-a" href="javascript:;"></a>' + '<div  style="clear:both;"></div></div></div><div class="mes_bd"></div></div>';
        tooltip.classed({
            "tooltip_img": false,
            "tooltip_line": true
        }).style("left", (parseInt($("svg").offset().left - $("#relational_graph").offset().left) + d3.mouse(this)[0]+10 ) + "px").style("top", (d3.mouse(this)[1]-($(".tooltip").height()/2)) + "px").style("display", "block").html(html);
        
        $(".mes_del").off("click").on("click", function() {
        	root.edges.splice(root.edges.indexOf(d), 1);//删除线条
        	//根据root.edges的关系进行分组编号
        	arrGrop(root.edges);
        	redraw();
/*
 		  d3.selectAll("text").each(function(d, i) { 
			  var sid = d3.select(this).attr("sourceId"); 
			  var tid = d3.select(this).attr("targetId");
		      if (sid == lsid && tid == ltid) {
			      d3.select(this).remove(); 
			      } 
		      });
		      d3.selectAll("line").each(function(d, i) { 
			  var sid = d3.select(this).attr("sourceId"); 
			  var tid = d3.select(this).attr("targetId");
		     if (sid == lsid && tid == ltid) { 
		    	 d3.select(this).remove(); 
		     } 
		   });
		  $ts.remove();
 */
        });
        $(".relation_name a").click(function(){
        	$(".relation_name a").removeClass("active");
        	$(this).addClass("active");
        	var rid = $(this).find("span").attr("data-rid");//新rid
        	var name = $(this).find("span").text();
        	$(".i_linetext").val(name);
        	d3.selectAll(".linetext").each(function(d, i) {
                var sid = d3.select(this).attr("sourceId");
                var tid = d3.select(this).attr("targetId");
                if (sid == lsid && tid == ltid) {
                	d.rid = rid;
                	d3.select(this).attr("rid",rid)
                    d.relation = name;
                    // 替换原始数据
                    d3.select(this).text(name);
                }
            });
        });
        // 弹出框input的事件，改变【关系】的名称
        $(".i_linetext").off("blur").on("blur", function() {        	
            d3.selectAll(".linetext").each(function(d, i) {
                var sid = d3.select(this).attr("sourceId");
                var tid = d3.select(this).attr("targetId");
                if (sid == lsid && tid == ltid) {
                   	var old_name = d3.select(this).text();
                   	var name = $.trim($(".i_linetext").val());
                   	if(name){
                   		var mark_N = false;
                   		root.edges.forEach(function(d,i){
                   			if(d.source.id == lsid && d.target.id == ltid){
        						if(d.rids){
        							d.rids.every(function(dd,i){
        							if(dd.name == name && name != old_name){
        								mark_N = true;
        				                return false;
        							}
        							return true;
        							});
        						}
                   			}
                   		});
                   		if(name == old_name){
                   			return false;
                   		}else if(!mark_N){
                       		root.edges.forEach(function(d,i){
                       			if(d.source.id == lsid && d.target.id == ltid){
                       				d.relation = name;
                       			}
                       		});
                       		$(".relation_name a.active span").html(name);
                       		//arrGrop(root.edges);
                   			redraw();
                   		}else{
   			                $.Notification.autoHideNotify(
   			                        'warning', 
   			                        'bottom right', 
   			                        '信息', 
   			                        '‘' + name + '’关系已经存在...'
   			                        );
                   		}
                   	}
                }
            });
        });
    }
    // 鼠标离开节点或连线
    function mouseout_hidden_tooltip(d) {
        if (mousedown_node)
            return;
       tooltip.on("mouseover", function() {
            tooltip.style("display", "block");
        }).on("mouseout", function() {
            tooltip.style("display", "none");
        });
        tooltip.style("display", "none");
    }
    // 鼠标移动到节点上
    function mouseover_nodes_img(d) {
        if (mousedown_node || !tipOnOff)
            return;
        this.style.cursor = 'hand';
        // 把鼠标变成小手
        var t = this;
        var $this = $(this);
        var entityID = d.id;
        /*
		 * 鼠标移入时， （1）通过 selection.html() 来更改提示框的文字 （2）通过更改样式 left 和 top
		 * 来设定提示框的位置 （3）设定提示框的透明度为1.0（完全不透明）
		 */
        /*<a class="mes_chs btn_s" href="javascript:;">选中</a>*/
        var html = '<div class="iimg"><em class="left_em"></em><div class="mes_hd">' + '<h2><span>【实体】 </span><input type="text" class="imgtext" value="' + d.name + '"/><a href="javascript:;" class="ion-edit"></a></h2>' + '<div class="mes_btns"><a class="mes_del btn_s ion-trash-a" href="javascript:;"></a>' + '<div style="clear:both;"></div></div></div></div>';
        tooltip.classed({
            "tooltip_img": true,
            "tooltip_line": false
        }).style("left", function(){
        	if(imgOnOff){
        		return (parseInt($("svg").offset().left - $("#relational_graph").offset().left) + d.x +35) + "px";
        	}else{
        		return (parseInt($("svg").offset().left - $("#relational_graph").offset().left) + d.x +25) + "px";
        	}
        }).style("top",function(){
        	if(imgOnOff){
        	}
        	return (parseInt($("svg").offset().top) + d.y - 108) + "px";
        })
        // .style("left", (parseInt($("svg").offset().left) + this.x.animVal.value + 265) + "px")
        // .style("top",(parseInt($("svg").offset().top) + this.y.animVal.value - 95) + "px")
        // .style("left", (parseInt($("svg").offset().left - $("#relational_graph").offset().left) + this.x.animVal.value + 95) + "px")
        // .style("left", (d3.mouse(this)[0] + 95) + "px").style("top",(d3.mouse(this)[1] - 96) + "px")
        .style("display", "block").html(html);
        $(".mes_del").off("click").on("click", function() {
        	
        	root.nodes.splice(root.nodes.indexOf(d), 1);//删除节点
        	
        	root.edges = root.edges.filter(function(l) { 
        			return (l.source !== d) && (l.target !== d); });
        	/*root.edges = root.edges.filter(function(l) { 
    			return (l.source === d) && (l.target === d); });
    	  toSplice.map(function(l) {
    		  root.edges.splice(root.edges.indexOf(l), 1); });*/
        	//根据root.edges的关系进行分组编号
        	arrGrop(root.edges);
        	redraw();
        //删除节点方式一
    /* 
            root.nodes.forEach(function(d,i){
            	if(d.id == entityID){
            		root.nodes.splice(i,1);
            	}
            });
        	//var tempEdges = root.edges.concat();
            root.edges.forEach(function(d,i){
            	if(d.source.id == entityID || d.target.id == entityID){
            		root.edges.splice(root.edges.indexOf(d),1);	
            	}
            	});
           // root.edges = [];
           // root.edges = tempEdges.concat();
            redraw();*/
        	
       //删除节点方式二
         /*      
          * $this.remove();
            d3.selectAll("line").each(function(d, i) {
                var sid = d3.select(this).attr("sourceId");
                var tid = d3.select(this).attr("targetId");
                if (sid == entityID || tid == entityID) {
                    d3.select(this).remove();
                }
            });
            d3.selectAll("text").each(function(d, i) {
                var sid = d3.select(this).attr("sourceId");
                var tid = d3.select(this).attr("targetId");
                if (sid == entityID || tid == entityID) {
                    d3.select(this).remove();
                }
            });*/
        });
        // 弹出框input的事件，改变节点的名称
        $(".imgtext").off("blur").on("blur", function() {
            d3.selectAll(".nodetext").each(function(d, i) {
                var sid = d3.select(this).attr("sourceId");
                if (sid == entityID) {
                	var old_name = d3.select(this).text();
                	var name = $.trim($(".imgtext").val());
                	if(name){
                		var mark_N = false;
                		root.nodes.forEach(function(d,i){
                			if(name && name == d.name && name != old_name){
                				mark_N = true;
                			}
                		});
                		if(name == old_name){
                			return false;
                		}else if(!mark_N){
                    		root.nodes.forEach(function(d,i){
                    			if(d.id == sid){
                    				d.name = name;
                    			}
                    		});
                    		//arrGrop(root.edges);
                			redraw();
/*                			d.name = $(".imgtext").val();
                			// 替换原始数据
                			d3.select(this).text($(".imgtext").val());*/
                		}else{
			                $.Notification.autoHideNotify(
			                        'warning', 
			                        'bottom right', 
			                        '信息', 
			                        '‘' + name + '’实体已经存在...'
			                        );
                		}
                	}
                }
            });
        });
    }
    // 鼠标在节点上按下
    function mousedown_nodes_img(d) {
    	 mousedown_node = d;  //赋值 mousedown_node 是 true
        if (!add_relation) {
            return;
        }
        
        if (mousedown_node == selected_node) {
            selected_node = null ;
        } else {
            selected_node = mousedown_node;
        }
        selected_link = null ;
        tooltip.style("display", "none");
        // reposition drag line
       //drag_line.attr("class", "link").attr("x1", mousedown_node.x).attr("y1", mousedown_node.y).attr("x2", mousedown_node.x).attr("y2", mousedown_node.y);
       drag_line.attr("class", "link").attr("x1", currentZoom*mousedown_node.x).attr("y1", currentZoom*mousedown_node.y).attr("x2", d3.mouse(this)[0]).attr("y2", d3.mouse(this)[1]);
       // drag_line.attr("class", "link").attr("d", 'M '+mousedown_node.x+' '+mousedown_node.y+' L '+ mousedown_node.x +' '+mousedown_node.y);
    }
    // 鼠标在节点上弹起
    function mouseup_nodes_img(d) {
    	if(!mousedown_node){
            // resetMouseVars();
             return;
        }
        if (mousedown_node) {
            mouseup_node = d;
            if (mouseup_node == mousedown_node) {
                resetMouseVars();
                return;
            }
            // add link
            var link = {
                source: mousedown_node,
                target: mouseup_node
            };
			var from={};
			from.id=mousedown_node.id;
			from.type=mousedown_node.type;
			from.name=mousedown_node.name;
			
			var to = {};
			to.id = d.id;
			to.type = d.type;
			to.name = d.name;
			$.post("/maintain/entity_relation_save_type",{from:JSON.stringify(from),to:JSON.stringify(to)},function(data){
				$(".modalbox").html("").html(data);
				$(".modalbox").show();
				$(".new_relate .sure").off("click");
				save_relation(link);
			});
			$.post("/maintain/filterRelationByEntityId", {
				 toId : to.id,
				 toType:to.type,
				 fromId :from.id,
				 fromType:from.type
			}, function(d) {
				$("#select_rel_add").html("").html(d);
			});
        }
        //key = false;
        resetMouseVars();
    }
    //重新绑定关系窗口的事件
    function save_relation(link){
    	// 确定
    	$(".new_relate .sure").click(function() {
    		var fromid=$("#zt_input").attr("data-id");
    		var fromtype=$("#zt_input").attr("data-type");
    		var fromname=$("#zt_input").val();
    		var toid=$("#kt_input").attr("data-id");
    		var totype=$("#kt_input").attr("data-type");
    		var start=$(".relStartTime").val();
    		var end=$(".relEndTime").val();
    		var rid=$("#select_rel_add").find("option:selected").attr("data-id");
    		var rname = $("#select_rel_add").find("option:selected").attr("data-relation");
    		var location=$(".eventplace").val().trim();
    		var param={};
    		param.fromid=fromid,
    		param.fromtype=fromtype,
    		param.toid=toid,
    		param.totype=totype,
    		
    		param.start=start;
    		param.end=end;
    		param.rid=rid;
    		if(location!="请选择"&&location!=""){
    			param.location=location;
    		}
    		if(!rid || rid==""){
    			$("#select_rel_add").parent().parent().css("border","1px solid #fd2727");
    			$.Notification.autoHideNotify(
    					'info', 
    					'bottom right', 
    					'完善信息', 
    					'请选择关系后再试...'
    			);
    			return false;
    		}else if(!toid || toid==""){
    			$.Notification.autoHideNotify(
    					'info', 
    					'bottom right', 
    					'完善信息', 
    					'请根选择客体后再试...'
    			);
    			/*
    			 * layer.msg('请搜索要关联的客体并选择..', function(){ return false; });
    			 */
    			return false;
    		}else{
				//判断开始时间和结束时间
				if($(".modalbox .inputwrap").find($(".relStartTime")).hasClass("must") && (!start || start =="")){
					$(".modalbox .inputwrap").find($(".relStartTime")).css("border","1px solid #f00");
					layer.msg("“" + rname + "”关系开始时间为必选条件!");
					return false;
				}
				$(".modalbox .inputwrap").find($(".relStartTime")).css("border","");
				if($(".modalbox .inputwrap").find($(".relEndTime")).hasClass("must") && (!end || end =="")){
					$(".modalbox .inputwrap").find($(".relEndTime")).css("border","1px solid #f00");
					layer.msg("“" + rname + "”关系结束时间为必选条件!");
					return false;
				}
				$(".modalbox .inputwrap").find($(".relEndTime")).css("border","");
				var R_K1 = false;// 标记是否已经存在关系
				var R_K2 = false;// 标记是否存在同名关系
				root.edges.every(function(d,i){
					if((d.source.id == link.source.id && d.target.id == link.target.id) 
							|| (d.source.id == link.target.id && d.target.id == link.source.id)){
						R_K1 = true;
						return false;
					}
					return true;
				});
    			relation_save(param);
    			function relation_save(param){
    				$.post("/maintain/entity_relation_save",{param:JSON.stringify(param)},function(rel){
    					if(rel.ret.status=="success"){
    						var irid = rel.neo4j_id;
    						if(!R_K1){
    							link.relation = rname;
    							var r = [];
    							r[0] = {id:irid,name:rname};
    							link.rids = r
    							link.rid = irid;
    							root.edges.push(link);
    						}else{
    							root.edges.every(function(d,i){
    								if((d.source.id == link.source.id && d.target.id == link.target.id) 
    										|| (d.source.id == link.target.id && d.target.id == link.source.id)){
    									
    									if(d.rids){
    										d.rids.every(function(dd,i){
    										if(dd.id==irid){
    											R_K2 = true;
    											$("#select_rel_add").parent().parent().css("border","1px solid #fd2727");
    							                $.Notification.autoHideNotify(
    							                        'warning', 
    							                        'bottom right', 
    							                        '信息', 
    							                        '‘' + rname + '’关系已经存在...'
    							                        );
    							                return false;
    										}
    										return true;
    										});
    									}
    									if(!R_K2){
    										d.relation = rname;
    										var rids = d.rids;
    										rids.push({id:irid,name:rname});
    										d.rids = rids;
    										d.rid = irid;
    										return false;
    									}
    								}
    								return true;
    							});
    						}
    						if(!R_K1 || !R_K2){
    							drag_line.attr("class", "drag_line_hidden");
    							//根据root.edges的关系进行分组编号
    							arrGrop(root.edges);
    							redraw();
    							$(".modalbox").empty().hide();
    							$.Notification.autoHideNotify(
    									'success', 
    									'bottom right', 
    									'保存成功', 
    									'This notification will be closed in 5 seconds...'
    							);
    						}
    					}else{
    						drag_line.attr("class", "drag_line_hidden");
    						$.Notification.autoHideNotify(
    								'error', 
    								'bottom right', 
    								'保存失败', 
    								'未能保存关系到系统, 请稍后再试...'
    						);
    					}
    				});
    			}
    		}
    	});
    }
    function save_relation_v1(link){
        // 确定
        $(".new_relate .sure").click(function() {
        	var fromid=$("#zt_input").attr("data-id");
        	var fromtype=$("#zt_input").attr("data-type");
        	var fromname=$("#zt_input").val();
        	var toid=$("#kt_input").attr("data-id");
        	var totype=$("#kt_input").attr("data-type");
    		var start=$(".relStartTime").val();
        	var end=$(".relEndTime").val();
        	var rid=$("#select_rel_add").find("option:selected").attr("data-id");
        	var rname = $("#select_rel_add").find("option:selected").attr("data-relation");
        	var location=$(".eventplace").val().trim();
    		var param={};
       		param.fromid=fromid,
       		param.fromtype=fromtype,
       		param.toid=toid,
       		param.totype=totype,
        	
        	param.start=start;
        	param.end=end;
        	param.rid=rid;
        	if(location!="请选择"&&location!=""){
        		param.location=location;
        	}
        	if(!rid || rid==""){
       		 $("#select_rel_add").parent().parent().css("border","1px solid #fd2727");
               $.Notification.autoHideNotify(
                       'info', 
                       'bottom right', 
                       '完善信息', 
                       '请选择关系后再试...'
                       );
       		return false;
       	}else if(!toid || toid==""){
                $.Notification.autoHideNotify(
                        'info', 
                        'bottom right', 
                        '完善信息', 
                        '请根选择客体后再试...'
                        );
        		/*
				 * layer.msg('请搜索要关联的客体并选择..', function(){ return false; });
				 */
        		return false;
        	}else{
				var R_K1 = false;// 标记是否已经存在关系
				var R_K2 = false;// 标记是否存在同名关系
				root.edges.every(function(d,i){
					if((d.source.id == link.source.id && d.target.id == link.target.id) 
							|| (d.source.id == link.target.id && d.target.id == link.source.id)){
						R_K1 = true;
						if(d.rids){
							d.rids.every(function(dd,i){
							if(dd.name==rname){
								R_K2 = true;
								$("#select_rel_add").parent().parent().css("border","1px solid #fd2727");
				                $.Notification.autoHideNotify(
				                        'warning', 
				                        'bottom right', 
				                        '信息', 
				                        '‘' + rname + '’关系已经存在...'
				                        );
				                return false;
							}
							return true;
							});
						}
						return false;
					}
					return true;
				});
				
				if(!R_K1 || !R_K2){
					//判断开始时间和结束时间
	    			if($(".modalbox .inputwrap").find($(".relStartTime")).hasClass("must") && (!start || start =="")){
	    				$(".modalbox .inputwrap").find($(".relStartTime")).css("border","1px solid #f00");
	    				layer.msg("“" + rname + "”关系开始时间为必选条件!");
	    				return false;
	    			}
	    			$(".modalbox .inputwrap").find($(".relStartTime")).css("border","");
	    			if($(".modalbox .inputwrap").find($(".relEndTime")).hasClass("must") && (!end || end =="")){
	    				$(".modalbox .inputwrap").find($(".relEndTime")).css("border","1px solid #f00");
	    				layer.msg("“" + rname + "”关系结束时间为必选条件!");
	    				return false;
	    			}
	    			$(".modalbox .inputwrap").find($(".relEndTime")).css("border","");
					relation_save(param);
				}
        		function relation_save(param){
        			$.post("/maintain/entity_relation_save",{param:JSON.stringify(param)},function(rel){
        				if(rel.ret.status=="success"){
        					$(".modalbox").empty().hide();
        					var irid = rel.neo4j_id;
        					if(!R_K1){
        						link.relation = rname;
        						var r = [];
        						r[0] = {id:irid,name:rname};
        						link.rids = r
        						link.rid = irid;
        						root.edges.push(link);
        					}else if(!R_K2){
        						root.edges.every(function(d,i){
        							if((d.source.id == link.source.id && d.target.id == link.target.id) 
        									|| (d.source.id == link.target.id && d.target.id == link.source.id)){
        								d.relation = rname;
        								var rids = d.rids;
        								rids.push({id:irid,name:rname});
        								d.rids = rids;
        								d.rid = irid;
        								return false;
        							}
        							return true;
        						});
        					}
        					drag_line.attr("class", "drag_line_hidden");
        					//根据root.edges的关系进行分组编号
        					arrGrop(root.edges);
        					redraw();
        					
        					$.Notification.autoHideNotify(
        							'success', 
        							'bottom right', 
        							'保存成功', 
        							'This notification will be closed in 5 seconds...'
        					);
        				}else{
        					drag_line.attr("class", "drag_line_hidden");
        					$.Notification.autoHideNotify(
        							'error', 
        							'bottom right', 
        							'保存失败', 
        							'未能保存关系到系统, 请稍后再试...'
        					);
        				}
        			});
        		}
        	}
        });
    }
    function mouseover() {
        tooltip.style("display", "none");
    }
    /*
 * function mousedown() { // debugger if (!mousedown_node && !mousedown_link) {
 * return; } }
 */
    function mousemove() {
        if (!mousedown_node || !add_relation) {
            return;
        }
        //拖拽放大的 终点坐标
        var traslateOffset = currentOffset;
		var x2 = d3.mouse(this)[0] - traslateOffset.x;
		var y2 = d3.mouse(this)[1] - traslateOffset.y;
        //console.log(d3.mouse(this)[0],d3.mouse(this));
        //drag_line.attr("x1", currentZoom*mousedown_node.x).attr("y1", currentZoom*mousedown_node.y).attr("x2", d3.mouse(this)[0]).attr("y2", d3.mouse(this)[1]);
        drag_line.attr("x1", currentZoom*mousedown_node.x).attr("y1", currentZoom*mousedown_node.y).attr("x2", x2).attr("y2", y2);
    }
    function mouseup() {
        if (mousedown_node || add_relation) {
            //key = false;
            // hide drag line
            drag_line.attr("class", "drag_line_hidden");
        }
        // clear mouse event vars
        resetMouseVars();
    }
    function keydown() {
        switch (d3.event.keyCode) {
        case 8:
            // backspace
        case 46:
            {
                // delete
                break;
            }
        case 17:
            {
                // ctrl
                key = true;
            }
        }
    }
    function resetMouseVars() {
        mousedown_node = null ;
        mouseup_node = null ;
        // mousedown_link = null;
    }
    function dragstart(d, i) {
        force.stop();
        // stops the force auto positioning before you start
        // dragging
    }
    function dragmove(d, i) {
        if (add_relation) {
            return;
        }
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        if(imgOnOff){// 有头像
        	tickImg();
        }else{
        	tickNode();
        }
        // this is the key to make it work together with updating both
        // px,py,x,y on d !
    }
    function dragend(d, i) {
        if (add_relation) {
            return;
        }
        d.fixed = true; // of course set the node to fixed so the force doesn't
        // include the node in its auto positioning stuff
        if(imgOnOff){// 有头像
        	tickImg();
        }else{
        	tickNode();
        }
        force.resume();
    }
   
    //拖动画布
    function dragMove(){
        // 拖动节点
 		if (mousedown_node) {
 			if (add_relation) {
 				//		   console.log("拖动节点 进行添加关系线");
 			} else {
 				// console.log("BEFORE->"+mousedown_node.x+","+mousedown_node.y);
 				mousedown_node.x += d3.event.dx * (1 / currentZoom);
 				mousedown_node.y += d3.event.dy * (1 / currentZoom);
 				// console.log(" AFTER->"+mousedown_node.x+","+mousedown_node.y);
 				if(!imgOnOff){//无头像
 					tickNode();
 				}else{
 					tickImg();
 				}
 				
 			}
 			//拖动画布
 		} else {
 			var off = {
 				x : currentOffset.x + d3.event.dx,
 				y : currentOffset.y + d3.event.dy
 			};
 			// drag: translate to new offset
 			if (off !== undefined && (off.x != currentOffset.x || off.y != currentOffset.y)) {
 				gBox = grpParent;
 				gBox.attr("transform", function(d) {
 					return "translate(" + off.x + "," + off.y + ")"
 				});
 				currentOffset.x = off.x;
 				currentOffset.y = off.y;
 			}
 			if (add_relation) {
 			} else {
 			}
 		}
    }

    //画布放大
    function doZoom(increment){
    	force.stop();
		// var _this = _D3RelationViz;
		newZoom = increment === undefined ? d3.event.scale : zoomScale(currentZoom + increment);
		if (currentZoom == newZoom)
			return; // no zoom change

		var mouse0 = d3.mouse(this)[0] ? d3.mouse(this)[0] : 1;
		var mouse1 = d3.mouse(this)[1] ? d3.mouse(this)[1] : 1;
		//	    if(!mouse0 && !mouse1){
		//	    	return;
		//	    }
		// Compute the new offset, so that the graph center does not move
		zoomRatio = newZoom / currentZoom;
		off = {
			x : currentOffset.x * zoomRatio + mouse0 * (1 - zoomRatio),
			y : currentOffset.y * zoomRatio + mouse1 * (1 - zoomRatio)
		};

		// drag: translate to new offset
		if (off !== undefined && (off.x != currentOffset.x || off.y != currentOffset.y)) {
			gBox = grpParent;
			gBox.attr("transform", function(d) {
				return "translate(" + off.x + "," + off.y + ")"
			});
			currentOffset.x = off.x;
			currentOffset.y = off.y;
		}
		var z = newZoom;
		currentZoom = z;
		// move edges   move nodes
		if(!imgOnOff){//无头像
			tickNode();
		}else{ //有头像
			tickImg();
		}
		
		/*
		nodes_text.attr("x", function(d) {
			return d.x + (node_w / 2) - (this.getComputedTextLength() / 2) + 8;
		});
		nodes_text.attr("y", function(d) {
			return d.y + node_h / 2;
		});
		*/
		// .attr("dy",_this_d3.text_dy_zoom);
    }
    
	function tickNode() {
		// 限制结点的边界
/*		root.nodes.forEach(function(d, i) {
			d.x = d.x - node_w / 2 < 0 ? node_w / 2 : d.x;
			d.x = d.x + node_w / 2 > width ? width - node_w / 2 : d.x;
			d.y = d.y - node_h / 2 < 0 ? node_h / 2 : d.y;
			d.y = d.y + node_h / 2 + text_dy > height ? height - node_h / 2 - text_dy : d.y;
		});*/
		nodes_circle.attr("cx", function(d) {
			var coordinate = currentZoom * d.x;
			return coordinate;
		}).attr("cy", function(d) {
			var coordinate = currentZoom * d.y;
			return coordinate;
		})
		// 更新连接线的位置
		edges_line.attr("d", linkArcNum);
		/*
		edges_line.attr("x1", function(d) {
			return d.source.x;
		});
		edges_line.attr("y1", function(d) {
			return d.source.y;
		});
		edges_line.attr("x2", function(d) {
			return d.target.x;
		});
		edges_line.attr("y2", function(d) {
			return d.target.y;
		});
		*/

		// 更新连接线上文字的位置
		edges_text.attr("dx", linkText);
		/*
		edges_text.attr('transform',function(d,i){
			if (d.target.x<d.source.x){
				bbox = this.getBBox();
				rx = bbox.x+bbox.width/2;
				ry = bbox.y+bbox.height/2;
				return 'rotate(180 '+rx+' '+ry+')';
			}
			else {
				return 'rotate(0)';
			}
			
	    });
	    */
		/*
		edges_text.attr("x", function(d) {
			return (d.source.x + d.target.x) / 2;
		});
		edges_text.attr("y", function(d) {
			return (d.source.y + d.target.y) / 2;
		});
        */
		
		// 更新结点图片和文字
		node.attr("x", function(d) {
			return currentZoom*d.x - node_w / 2;
		});
		node.attr("y", function(d) {
			return currentZoom*d.y - node_h / 2;
		});
		nodes_text.attr("x", function(d) {
			return currentZoom*d.x - (this.getComputedTextLength() / 2) + 8;
		});
		nodes_text.attr("y", function(d) {
			return currentZoom*d.y + r;
		});
		// test(nodes_text,data.center.name);
	};

    function tickImg() {
        // 限制结点的边界
    	/*
        root.nodes.forEach(function(d, i) {
            d.x = d.x - img_w / 2 < 0 ? (img_w / 2)+ 5 : d.x;
            d.x = d.x + img_w / 2 > width ? width - img_w / 2 - 5: d.x;
            d.y = d.y - img_h / 2 < 0 ? img_h / 2 + 5: d.y;
            d.y = d.y + img_h / 2 + text_dy > height ? height - img_h / 2 - text_dy - 5 : d.y;
        });*/
    	
        // 更新结点图片和文字
        nodes_circle.attr("cx", function(d) {
            return currentZoom*d.x;
        });
        nodes_circle.attr("cy", function(d) {
            return currentZoom*d.y;
        });
        nodes_text.attr("x", function(d) {
            return currentZoom*d.x;
        });
        nodes_text.attr("y", function(d) {
            return currentZoom*d.y + img_w / 2;
        });
        // 更新连接线的位置
        edges_line.attr("d", linkArcNum);
        /*
        edges_line.attr("x1", function(d) {
            return d.source.x;
        });
        edges_line.attr("y1", function(d) {
            return d.source.y;
        });
        edges_line.attr("x2", function(d) {
            return d.target.x;
        });
        edges_line.attr("y2", function(d) {
            return d.target.y;
        });
        */
        
        // 更新连接线上文字的位置
        edges_text.attr("dx", linkText);
        /*
        edges_text.attr("x", function(d) {
            return (d.source.x + d.target.x) / 2;
        });
        edges_text.attr("y", function(d) {
            return (d.source.y + d.target.y) / 2;
        });
        */
        // test(nodes_text,data.center.name);
    } 
    
	$(".js_doc").attr("disabled", true);
	//根据root.edges的关系进行分组编号
	function arrGrop(datas){
	    var links = datas;
		//关系分组
		var linkGroup = {};
		var linkmap = {};  //对连接线进行统计和分组，不区分连接线的方向，只要属于同两个实体，即认为是同一组  
		//var links = root.edges;
	  	for(var i=0; i<links.length; i++){
	  		var key;
	  		if(typeof links[i].source === 'object' || typeof links[i].target === 'object'){
	  			key =links[i].source.index<links[i].target.index?links[i].source.index+':'+links[i].target.index:links[i].target.index+':'+links[i].source.index;  
	  		}else{
	  			key = links[i].source<links[i].target?links[i].source+':'+links[i].target:links[i].target+':'+links[i].source;  
	  		}
	  		if(!linkmap.hasOwnProperty(key)){  
	  			linkmap[key] = 0;  
	  		}  
	  		linkmap[key]+=1;  
	  		if(!linkGroup.hasOwnProperty(key)){  
	  			linkGroup[key]=[];  
	  		}  
	  		linkGroup[key].push(links[i]); 
//	  	    console.log(linkGroup[key]);
	  	  if(linkGroup[key].length>setNum){
	  			linkmap[key] = setNum;
	  		}
	  	}  
	  	//为每一条连接线分配size属性，同时对每一组连接线进行编号  
	  	for(var i=0; i<links.length; i++){  
	  		/*var key;
	  		if(typeof links[i].source === 'object' || typeof links[i].target === 'object'){
	  			key =links[i].source.index<links[i].target.index?links[i].source.index+':'+links[i].target.index:links[i].target.index+':'+links[i].source.index;  
	  		}else{
	  			key = links[i].source<links[i].target?links[i].source+':'+links[i].target:links[i].target+':'+links[i].source;  
	  		}
	  		links[i].size = linkmap[key];  
	  		//同一组的关系进行编号  
	  		var group = linkGroup[key];  
	  		var keyPair = key.split(':');  
	  		var type = 'noself';//标示该组关系是指向两个不同实体还是同一个实体  
	  		if(keyPair[0]==keyPair[1]){  
	  			type = 'self';  
	  		}  
	  		//给节点分配编号
	  		setLinkNumber(group,type); */ 
	  		var key;
	  		if(typeof links[i].source === 'object' || typeof links[i].target === 'object'){
	  			key =links[i].source.index<links[i].target.index?links[i].source.index+':'+links[i].target.index:links[i].target.index+':'+links[i].source.index;  
	  		}else{
	  			key = links[i].source<links[i].target?links[i].source+':'+links[i].target:links[i].target+':'+links[i].source;  
	  		}
	  		//var key = links[i].source<links[i].target?links[i].source+':'+links[i].target:links[i].target+':'+links[i].source;  
			links[i].size = linkmap[key];  
			//同一组的关系进行编号  
			var group = linkGroup[key];  
			var keyPair = key.split(':');  
			var type = 'noself';//标示该组关系是指向两个不同实体还是同一个实体  
			if(keyPair[0]==keyPair[1]){  
				type = 'self';  
			}  
			//给节点分配编号  
			if(typeof links[i].source === 'object' || typeof links[i].target === 'object'){
	  		}else{
	  			setLinkNumber(group,type); 
	  		}
			
	  		
	  	}  
	}    
	//设置连接线的坐标,根据连接线的数目 奇偶数 连线
	function linkArcNum(d) {
		/*
		//如果连接线连接的是同一个实体，则对path属性进行调整，绘制的圆弧属于长圆弧，同时对终点坐标进行微调，避免因坐标一致导致弧无法绘制  
	      if(d.target==d.source){  
	          dr = 30/d.linknum;  
				//console.log(dr,d.linknum);
	          return"M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 1,1 " + d.target.x + "," + (d.target.y+1);  
	      }else if(d.size%2!=0 && d.linknum==1){//如果两个节点之间的连接线数量为奇数条，则设置编号为1的连接线为直线，其他连接线会均分在两边  
	          return 'M '+d.source.x+' '+d.source.y+' L '+ d.target.x +' '+d.target.y;  
	      }  
	      //根据连接线编号值来动态确定该条椭圆弧线的长半轴和短半轴，当两者一致时绘制的是圆弧  
	      //注意A属性后面的参数，前两个为长半轴和短半轴，第三个默认为0，第四个表示弧度大于180度则为1，小于则为0，这在绘制连接到相同节点的连接线时用到；第五个参数，0表示正角，1表示负角，即用来控制弧形凹凸的方向。本文正是结合编号的正负情况来控制该条连接线的凹凸方向，从而达到连接线对称的效果  
	      var curve=1.5;  
	      var homogeneous=1.2;  
	      var dx = d.target.x - d.source.x,  
	          dy = d.target.y - d.source.y,  
	          dr = Math.sqrt(dx*dx+dy*dy)*(d.linknum+homogeneous)/(curve*homogeneous);  
	      //当节点编号为负数时，对弧形进行反向凹凸，达到对称效果  
	      if(d.linknum<0){  
	          dr = Math.sqrt(dx*dx+dy*dy)*(-1*d.linknum+homogeneous)/(curve*homogeneous);  
	          return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,0 " + d.target.x + "," + d.target.y;  
	      }  
	      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;  
	      */
		//如果连接线连接的是同一个实体，则对path属性进行调整，绘制的圆弧属于长圆弧，同时对终点坐标进行微调，避免因坐标一致导致弧无法绘制   
		if(d.target==d.source){  
	          dr =currentZoom*(30/d.linknum);  
				//console.log(dr,d.linknum);
	          return"M" + currentZoom*(d.source.x) + "," + currentZoom*(d.source.y) + "A" + dr + "," + dr + " 0 1,1 " + currentZoom*(d.target.x) + "," + currentZoom*(d.target.y+1);  
	      }else if(d.size%2!=0 && d.linknum==1){//如果两个节点之间的连接线数量为奇数条，则设置编号为1的连接线为直线，其他连接线会均分在两边  
	          return 'M '+currentZoom*(d.source.x)+' '+currentZoom*(d.source.y)+' L '+ currentZoom*(d.target.x )+' '+currentZoom*(d.target.y);  
	      }  
	      //根据连接线编号值来动态确定该条椭圆弧线的长半轴和短半轴，当两者一致时绘制的是圆弧  
	      //注意A属性后面的参数，前两个为长半轴和短半轴，第三个默认为0，第四个表示弧度大于180度则为1，小于则为0，这在绘制连接到相同节点的连接线时用到；第五个参数，0表示正角，1表示负角，即用来控制弧形凹凸的方向。本文正是结合编号的正负情况来控制该条连接线的凹凸方向，从而达到连接线对称的效果  
	      var curve=1.5;  
	      var homogeneous=1.2;  
	      var dx = currentZoom*(d.target.x) - currentZoom*(d.source.x),  
	          dy = currentZoom*(d.target.y) - currentZoom*(d.source.y),  
	          dr = Math.sqrt(dx*dx+dy*dy)*(d.linknum+homogeneous)/(curve*homogeneous);  
	      //当节点编号为负数时，对弧形进行反向凹凸，达到对称效果  
	      if(d.linknum<0){  
	          dr = Math.sqrt(dx*dx+dy*dy)*(-1*d.linknum+homogeneous)/(curve*homogeneous);  
	          if(Math.abs(d.linknum)>(setNum+1)/2){
	        	$(this).attr("stroke-opacity","0");  
	          }
	          return "M" + currentZoom*(d.source.x) + "," + currentZoom*(d.source.y) + "A" + dr + "," + dr + " 0 0,0 " + currentZoom*(d.target.x) + "," + currentZoom*(d.target.y); 
	      }
	      if(d.linknum>0){
	    	  if(d.linknum>(setNum+1)/2){
	    		  $(this).attr("stroke-opacity","0"); 
	    	  }
	    	  return "M" + currentZoom*(d.source.x) + "," + currentZoom*(d.source.y) + "A" + dr + "," + dr + " 0 0,1 " + currentZoom*(d.target.x) + "," + currentZoom*(d.target.y);  
	      }
	      
	      
		}
	// 更新连接线上文字的位置
	function linkText(d){
		//return (d.source.px + d.target.px) / 2;
		//var dx =currentZoom*(Math.abs(d.target.px - d.source.px)>Math.abs(d.target.py - d.source.py)?Math.abs(d.target.px - d.source.px):Math.abs(d.target.py - d.source.py))/ 2;		
		var dx = currentZoom*Math.sqrt(Math.pow(Math.abs(d.source.x - d.target.x),2)+Math.pow(Math.abs(d.source.y - d.target.y),2))/2 - 16;
		return dx;
	}
	//设置圆圈和文字的坐标
	function transform1(d) {
	  return "translate(" + d.x + "," + d.y + ")";
	}
	function transform2(d) {
		  return "translate(" + (d.x) + "," + d.y + ")";
	}
	//根据连线的数目进行分配
	function setLinkNumber(group,type){  
			if(group.length==0) return;  
	        //对该分组内的关系按照方向进行分类，此处根据连接的实体ASCII值大小分成两部分  
	        var linksA = [], linksB = [];  
	        for(var i = 0;i<group.length;i++){  
	            var link = group[i];  
	            if(link.source < link.target){  
	                linksA.push(link);  
	            }else{  
	                linksB.push(link);  
	            }  
	        }  
			//console.log(group,linksA,linksB);
	        //确定关系最大编号。为了使得连接两个实体的关系曲线呈现对称，根据关系数量奇偶性进行平分。  
	        //特殊情况：当关系都是连接到同一个实体时，不平分  
	        var maxLinkNumber = 0;  
	        if(type=='self'){  
	               maxLinkNumber = group.length;  
	         }else{  
	               maxLinkNumber = group.length%2==0?group.length/2:(group.length+1)/2;  
	         }  
	         //如果两个方向的关系数量一样多，直接分别设置编号即可  
             if(linksA.length==linksB.length){  
	               var startLinkNumber = 1;  
	               for(var i=0;i<linksA.length;i++){  
	                   linksA[i].linknum = startLinkNumber++;  
	               }  
	               startLinkNumber = 1;  
	               for(var i=0;i<linksB.length;i++){  
	                   linksB[i].linknum = startLinkNumber++;  
	               }  
              }else{//当两个方向的关系数量不对等时，先对数量少的那组关系从最大编号值进行逆序编号，然后在对另一组数量多的关系从编号1一直编号到最大编号，再对剩余关系进行负编号  
	               //如果抛开负号，可以发现，最终所有关系的编号序列一定是对称的（对称是为了保证后续绘图时曲线的弯曲程度也是对称的）  
	               var biggerLinks,smallerLinks;  
	               if(linksA.length>linksB.length){  
	                   biggerLinks = linksA;  
	                   smallerLinks = linksB;  
	               }else{  
	                   biggerLinks = linksB;  
	                   smallerLinks = linksA;  
	               }  
     
	               var startLinkNumber = maxLinkNumber;  
	               for(var i=0;i<smallerLinks.length;i++){  
	                   smallerLinks[i].linknum = startLinkNumber--;  
	               }  
	               var tmpNumber = startLinkNumber;  
     
	               startLinkNumber = 1;  
	               var p = 0;  
	               while(startLinkNumber<=maxLinkNumber){  
	                   biggerLinks[p++].linknum = startLinkNumber++;  
	               }  
	               //开始负编号  
	               startLinkNumber = 0-tmpNumber;  
	               for(var i=p;i<biggerLinks.length;i++){  
	                   biggerLinks[i].linknum = startLinkNumber++;  
	               }  
              }   
		     //关系连线多于 setNum时 需要显示和隐藏的数据
		  	if(group.length>setNum){
		  			var newArry1 = [];
	 				var newArry2 = [];
		  			$.each(group,function(i,n){
		  				if(Math.abs(n.linknum) >(setNum+1)/2){ //隐藏的数据
		  					//console.log(n.linknum,n,"隐藏");
		  					newArry1.push(n);
		  				}else{//显示的数据
		  					//console.log(n.linknum,n,"显示");
		  					newArry2.push(n);
		  				}
		  			});
		  			newEdgeshide.push(newArry1);
		  			newEdgesshow.push(newArry2);
		  		}
		  	
		  } 
//	 console.log(newEdgesshow,newEdgeshide);
}

/**
 * 修改d3节点文字的样式
 * 
 * @param nodes_text
 * @param name
 */
function change_node_text_class(nodes_text, name) {
    nodes_text.forEach(function(d, i) {
        d.forEach(function(d, i) {
            if ($(d).html() == name) {
                $(d).addClass("center");
            } else {
            }
        });
    });
}
//改变样式
function change_style(name, lsid, ltid) {
    // 节点的文字样式
    d3.selectAll(".nodetext").each(function(d, i) {
        if (name != d3.select(this).text()) {
            d3.select(this).classed("selected", false);
        }
        var sid = d3.select(this).attr("sourceId");
        if (sid == lsid && !ltid && !$(this).hasClass("selected")) {
            d3.select(this).classed("selected", true);
        }
    });
    // 线的文字样式
    /*	d3.selectAll(".linetext").each(function(d, i) {
		d3.select(this).style("fill", "#FFF");
		var sid = d3.select(this).attr("sourceId");
		var tid = d3.select(this).attr("targetId");
		if (sid == lsid && tid == ltid) {
			d3.select(this).style("fill", "rgb(255, 153, 0)");
		}
	});*/
    //  线的样式
    d3.selectAll("line").each(function(d, i) {
        d3.select(this).classed("selected", false);
        var sid = d3.select(this).attr("sourceId");
        var tid = d3.select(this).attr("targetId");
        if (sid == lsid && tid == ltid) {
            d3.select(this).style("selected", true);
        }
    });
}
function selectElement(nodes_text, attr) {
    nodes_text.forEach(function(d, i) {
        d.forEach(function(d, i) {
            if ($(d).attr("sourceId") == attr) {
                $(d).remove();
            }
        });
    });
}
// 提交图片数据到后台并下载图片
function submit_download_form(output_format) {
    // Get the d3js SVG element
    var tmp = document.getElementById("relational_graph");
    var svg = tmp.getElementsByTagName("svg")[0];
    // Extract the data as SVG text string
    var svg_xml = (new XMLSerializer).serializeToString(svg);
    // Submit the <FORM> to the server.
    // The result will be an attachment file to download.
    var form = document.getElementById("svgform");
    form['output_format'].value = output_format;
    form['data'].value = svg_xml;
    form.submit();
}
//添加节点查看节点详情
function svg_entity_info(entity_type,entity_id) {
	$(".modalbox").load("/maintain/entity_detail_info_show", {
		entity_type : entity_type,
		entity_id : entity_id
	}, function(data) {
		entity_save_common();
		if (entity_type == 1) {
			entity_save_person_init(false);
			entity_save_person(3, entity_id);
		}
		if (entity_type == 2) {
			entity_save_org_init(false);
			entity_save_org(3, entity_id);
		}
		if (entity_type == 6) {
			entity_save_event_init(false);
			entity_save_event(3, entity_id);
		}

	}).show();
}
