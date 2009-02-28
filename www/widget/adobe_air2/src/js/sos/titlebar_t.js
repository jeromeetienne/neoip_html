/**
 * Handle titlebar for picinpic window
 * @class titlebar_t
*/
var titlebar_t = function (){
	/**
	 * build the titlebar
	 */
	var build	= function(element){
		var html_str	= null;
		html_str1	= "<a href='#'><img id='iconResizeWinW' src='../images/resize-nw.png' " +
					"style='position: absolute; left: 0; cursor: nw-resize;'/></a>";
		html_str2	= "<a href='#' class='gripper' id='iconMoveWin' " +
					"style='position: absolute; left: 16; width: 100%; padding-right: -16px;'></a>";
		html_str3	= "<a href='#'><img id='iconResizeWinE' src='../images/resize-ne.png' " +
					"style='position: absolute; right: 0; cursor: ne-resize;'/> </a>";
		$(element).empty()
			.append(html_str1)
			.append(html_str2)
			.append(html_str3);
	}

	// return public functions and variables	
	return {
		build:	build
	}
}
