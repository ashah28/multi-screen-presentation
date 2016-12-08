/*////////////////////////////////////////////////////////////////
Logic for options page.
*////////////////////////////////////////////////////////////////

var options = {};
$(document).ready(function(){
	//chrome.storage.sync.clear();
	options.convertProfilesToNewNamingScheme();

	$('#profile-settings').hide();
	$('#shortcuts').hide();
	options.add_to_list = true;
	options.currMon = 1;
	options.gridColumns = 1;
	options.gridRows = 1;
	options.numberOfMonitors = 1;
	options.locations = [];
	options.curr_profile = {};
	options.currentShortcuts = {};
	options.customShortcutNames = [];

  $('[data-toggle="tooltip"]').tooltip();
	options.populate();

	// set up listeners for page events
	document.querySelector('#edit').addEventListener('change',function(profileName,isnew){
		existing = $('select[id=edit]').val();
		options.edit(existing,false)
	});
	document.querySelector('#new').addEventListener('click',function(profileName,isnew){
		options.edit("New profile",true)
	});
	document.querySelector('#save').addEventListener('click',options.save);
	document.querySelector('#refresh').addEventListener('click',options.refresh);
	document.querySelector('#delete').addEventListener('click',options.deleteProfile)
	document.querySelector('#cancel').addEventListener('click',options.cancel);
	document.querySelector('#monNum').addEventListener('change',options.urlField);
	document.querySelector('#name').addEventListener('change',function(){options.add_to_list = true});
	document.querySelector('#row').addEventListener('change',options.gridY);
	document.querySelector('#col').addEventListener('change',options.gridX);
	document.querySelector('#monGrid').addEventListener('click',options.clickGrid);
	document.querySelector('#monGrid').addEventListener('dblclick',options.clickCtrl);
	document.querySelector('#clear').addEventListener('click',options.clear);
	document.querySelector('#back').addEventListener('click',options.back);
	document.querySelector('#help').addEventListener('click',options.help);
	document.querySelector('#shortcut-button').addEventListener('click',options.shortcuts);

	options.initializeShortcutPage();

});

// update naming scheme if data was saved using old version
options.convertProfilesToNewNamingScheme = function() {
	chrome.storage.sync.get('settings',function(obj){
		var newObject = obj.settings;
		$.each(obj.settings,function(index,value){
			profileObject = JSON.parse(value)

			if(profileObject.name){
				profileObject.n = profileObject.name;
				delete profileObject.name;
			}

			if(profileObject.profileName){
				profileObject.n = profileObject.profileName;
				delete profileObject.profileName;
			}

			if(profileObject.loc){
				profileObject.l = profileObject.loc;
				delete profileObject.loc;
			}

			if(profileObject.monitorLocationArray) {
				profileObject.l = profileObject.monitorLocationArray;
				delete profileObject.monitorLocationArray;
			}

			if(profileObject.gridRows){
				profileObject.r = profileObject.gridRows;
				delete profileObject.gridRows;
			}

			if(profileObject.gridColumns){
				profileObject.c = profileObject.gridColumns;
				delete profileObject.gridColumns;
			}

			if(profileObject.mon){
				profileObject.m = profileObject.mon;
				delete profileObject.mon;
			}

			if(profileObject.numberOfMonitors) {
				profileObject.m = profileObject.numberOfMonitors;
				delete profileObject.numberOfMonitors;
			}

			if(profileObject.url){
				profileObject.u = profileObject.url;
				delete profileObject.url;
			}

			if(profileObject.urlArray){
				profileObject.u = profileObject.urlArray;
				delete profileObject.urlArray;
			}

			if(profileObject.ctl){
				profileObject.controlMonitorLocation = profileObject.ctl;
				delete profileObject.ctl;
			}

			if(profileObject.controlMonitorLocation) {
				profileObject.t = profileObject.controlMonitorLocation;
				delete profileObject.controlMonitorLocation;
			}

			if(profileObject.save){
				delete profileObject.save;
			}

			newObject[index] = JSON.stringify(profileObject);

		});
		chrome.storage.sync.set({
				'settings':newObject
		})
	});
}

/*////////////////////////////////////////////////////////////////
Functions for edit profile menu
*/////////////////////////////////////////////////////////////////
// edit a profile (saved or new)
options.edit = function(profileName,isnew) {
	$('#name').val(profileName);
	$('#main-menu').hide();
	$('#profile-settings').show();
	$('#delete').attr('disabled',true)
	options.alreadyClicked = false;

	if(isnew==false){
		// retrieve settings and populate fields;
		options.alreadyClicked = true;
		$('#delete').attr('disabled',false)
		options.add_to_list = false
		chrome.storage.sync.get('settings',function(obj){
			var object = JSON.parse(obj.settings[profileName]);
			$('#name').val(object.n);
			$('#monNum').val(object.m);
			$('#row').val(object.r);
			$('#col').val(object.c);
			options.gridY();
			options.gridX();
			$(object.l).each(function(index,value){
				var numberOfMonitors = $('td.monitor-grid-element[data-row='+value[0]+'][data-col='+value[1]+']');
				$(numberOfMonitors).attr('bold',true).html(value[2]);
				options.currMon = Number(value[2]) + 1;
			});
			var c = $('td.monitor-grid-element[data-row='+object.t[0]+'][data-col='+object.t[1]+']');
			$('td.monitor-grid-element').attr('clicked',false);
			$(c).attr('clicked',true);
			options.urlField();
			var n = 0;
			$('.url input').each(function(index,value){
				$(this).val(object.u[index]);
			});
		});
	};
}

// populate dropdown list with saved profiles
options.populate = function(){
	$('#edit').html('');
	options.profile_names = [];
	chrome.storage.sync.get('settings',function(obj){
		options.object = obj.settings;
		if (options.object == undefined){
			chrome.storage.sync.set({
				'settings':'{}'
			});
		} else {
		$.each(options.object,function(index,value){
			prf = JSON.parse(value).n
			options.profile_names.push(prf);
			$('#edit').append('<option value="'+prf+'">'+prf+'</option>');
		});
		$('#edit').val('none');
		}
	});
}

// update the monitor grid display when row/column controls change
options.gridY = function(){

	var r = options.r

	var rowStr = "";
	for(var k=0; k<options.c; k++){
		rowStr = rowStr.concat('<td class="monitor-grid-element" data-row='+r+' data-col='+k+'></td>');
	}

	var row = Number(document.getElementById('row').value);
	if (row>r){
		for (var j=r; j<row; j++){
			$('#monGrid').append('<tr class="monitor-grid-row">'+rowStr+'</tr>');
			r = ++r;
		}
	} else{
		var j = $('tr.monitor-grid-row').length
		for (j; j>row; j--){
			$('tr.monitor-grid-row').last().remove();
			r = --r;
		}
	}
	options.r = row;

}

options.gridX = function(){
	var c = options.c
	var r = options.r

	var col = Number(document.getElementById('col').value);
	if (col>c){
		for (var j=c; j<col; j++){
			$('tr.monitor-grid-row').each(function(index,value){
				$(value).append('<td class="monitor-grid-element" data-row='+(index)+' data-col='+j+' bold=false></td>');
			});
		}
	} else{
		var j = $('td.monitor-grid-element[data-row="0"]').length
		for (j; j>col; j--){
			$('tr.monitor-grid-row').each(function(index,value){
				$(value).children().last().remove();
			})
		}
	}
	options.c = col;

}

// when a grid element is clicked, highlight element and display monitor number
options.clickGrid = function(event){
	if(event.target !== event.currentTarget){
		var clickedItem = event.target;
		var monNum = Number($('#monNum').val())

		if (options.currMon <= monNum){
			if($(clickedItem).attr('bold') == 'false'){
				$(clickedItem).attr('bold',true).html(options.currMon)
				options.currMon = ++options.currMon
			}
		}
	}
	event.stopPropagation();
}

// when a grid element is double-clicked, highlight element
options.clickCtrl = function() {
	options.alreadyClicked = true;
	if(event.target !== event.currentTarget){
		var dblClicked;
		dblClicked = event.target;
		$('td.monitor-grid-element[clicked=true]').attr('clicked',false);

		$(dblClicked).attr('clicked',true);
	}
	event.stopPropagation();
}

// undo last section from monitor grid
options.back = function(){
	$('td.monitor-grid-element:contains("'+(options.currMon-1)+'")').attr('bold',false).html('');
	if (options.currMon > 1){
		options.currMon = --options.currMon;
	};
}

// clear selections from grid display
options.clear = function(){
	$('td.monitor-grid-element').attr('bold',false).attr('clicked',false).html('');
	options.currMon = 1;

}

// show help alert on click
options.help = function(){
	var help = 'Each grid square represents a monitor. Expand the grid to the desired dimensions, then click a sequence of squares corresponding to the location of the presentation monitors. Then double click the square corresponding to the control monitor (the monitor containing the Start menu).'
	chrome.extension.getBackgroundPage().alert(help);
}

// add url fields when # of Monitors is changed (this could be set by # of browsers later on)
options.urlField = function() {
	var i = options.m
	var monitors = Number(document.getElementById('monNum').value);
	if (monitors>i){
		for (var j=i; j<monitors; j++){
				$('#urls').append('<div id="a'+j+'" class="url"><input type="url" class="form-control"></br></div>');
		}
	} else{
		var j = $('.url').length
		for (j; j>monitors; j--){
				$('.url').last().remove();
		}
	}
	options.m = monitors;
}

options.save = function() {
	if (options.alreadyClicked == false){
		chrome.extension.getBackgroundPage().alert('Error: no control monitor selected. Please double click the square that corresponds to the control monitor (the monitor on which the start menu is displayed.')
	} else{

		var name = document.getElementById('name').value.replace(' ','_');
		var monitors = document.getElementById('monNum').value;
		var rows = document.getElementById('row').value;
		var col = document.getElementById('col').value;
		var controlElement = $('td.monitor-grid-element[clicked=true]');
		var control = [$(controlElement).attr('data-row'),$(controlElement).attr('data-col')]
		var locations = [];
		var selected = $('td.monitor-grid-element[bold=true');
		$.each(selected,function(index,value){
			locations.push([$(value).attr('data-row'),$(value).attr('data-col'),$(value).html()])
		});
		var project_urls = [];
		$('.url input[type=url]').each(function(index,value){
			project_urls.push(this.value);
		});

		// This settings object will be saved in chrome.storage.sync a a stringified
		// JSON object. The byte (character) limit per item is 8192, and the total is
		// 102400. TO save space, I have chosen minimal, rather than descriptive
		// names for keys.
		var settings = {
			n: name,
			m: monitors,
			r: rows,
			c: col,
			l: locations,
			u: project_urls,
			t: control,
		}
		var exit = false
		var confirm_overwrite = false
		// check if name is in use
		$.each(options.profile_names, function(index,value){
			if (options.add_to_list==true && value == name){
				confirm_overwrite = true
			}
		});

		if (confirm_overwrite){
			var overwrite = chrome.extension.getBackgroundPage().confirm('A profile already exists by that name. Overwrite?')
			if(overwrite){
				exit = false;
				options.add_to_list=false;
			} else {
				exit = true;
			}
		}

		if(!exit){
			if (options.add_to_list==true){
				$('#edit').append('<option value="'+name+'">'+name+'</option>');
			}

			// to save, the entire object must be retrieved, the individual profile altered,
			// and then the whole object saved again
			chrome.storage.sync.get('settings',function(obj){
				options.curr_profile = obj.settings;
				options.curr_profile[name] = JSON.stringify(settings);
				console.log(JSON.stringify(options.curr_profile).length);
				if(JSON.stringify(options.curr_profile).length > 8190){
					console.log('exceeded');
					chrome.extension.getBackgroundPage().alert('Chrome storage allotment exceeded. Please delete one or more profiles before saving another.');
					return;
				}
				chrome.storage.sync.set({
					'settings':options.curr_profile
				});
			});

			$('#profile-settings').hide();
			$('#main-menu').show();
			$('#edit').val('none');
			options.refresh();
		};
	};
}

// reset settings to "New Profile" settings
options.refresh = function() {
	$('#name').val('New profile');
	$('#monNum').val('1');
	$('#a0').children()[0].value = ''
	$('#row').val(1);
	$('#col').val(1);
	options.gridY();
	options.gridX();
	options.currMon = 1;
	options.urlField();
	options.add_to_list = true;
	options.clear();
	setTimeout(options.populate,1000);
}

// delete profile. Since profile is deleted by accessing the name, if two items on the list have the same name, both will be deleted
options.deleteProfile = function() {

		//var del = chrome.extension.getBackgroundPage().confirm('Are you sure you want to delete this profile?');
		//if(del){
			var toDelete = $('#name').val();
			chrome.storage.sync.get('settings',function(obj){
				newObject = obj.settings;
				delete newObject[toDelete];
				$('#edit option[value='+toDelete+']').remove();
				chrome.storage.sync.set({
					'settings':newObject
				})
				options.cancel()
			});
		//};

}

// close editor without saving changes
options.cancel = function() {
	options.refresh();
	var cancelButtons = document.querySelectorAll('.cancel-edit-shortcut')
	for (i=0; i<cancelButtons.length; i++){
		$(cancelButtons[i]).click();
	}
	$('#profile-settings').hide();
	$('#shortcuts').hide();
	$('#main-menu').show();
	$('#edit').val('none');
}



/*////////////////////////////////////////////////////////////////
Functions for shortcut settings menu
*/////////////////////////////////////////////////////////////////
options.initializeShortcutPage = function(){
	document.querySelector('#done').addEventListener('click',options.cancel);
	document.querySelector('#add-new-shortcut').addEventListener('click',options.addShortcut);

	options.retrieveShortcutList();

	var editShorcutButtons = document.querySelectorAll('.edit-shortcut-button');
	//var cancelShortcutButtons = document.querySelectorAll('.cancel-edit-shortcut');
	for (var i=0; i<editShorcutButtons.length; i++){
		editShorcutButtons[i].addEventListener('click', function(shortcutName){
			options.editShortcut(false);
		});

	}
}

// When the "Shortcuts" button is clicked open shortcuts menu
options.shortcuts = function(){
	$('#main-menu').hide();
	$('#shortcuts').show();
}

options.retrieveShortcutList = function(){

	chrome.storage.sync.get('custom',function(obj){
		options.customShortcutNames = obj.custom;
		$.each(options.customShortcutNames,function(index,value){
			options.appendShortcut(false, value, function(){});
		});
	});
}

// load keyboad view and add event listeners to its components
options.editShortcut = function(isNew){
	$(event.target).hide();
	$('.cancel-edit-shortcut').click();

	$(event.target).parent().append("<button class='btn btn-default pull-right cancel-edit-shortcut'><span class='glyphicon glyphicon-remove'></span></button>")

	var shortcutPanel  = 	$(event.target).closest('.shortcut-panel');
	var shortcutName = $(shortcutPanel).attr('data-shortcutName');

	if($(shortcutPanel).hasClass('custom-shortcut')){
		var shortcutTitle = $(shortcutPanel).find('.shortcut-title')
		$(shortcutTitle).parent().append("<select class='shortcut-title form-control'></select>")
		$(shortcutTitle).remove();
		var shortcutSelect = $(shortcutPanel).find('.shortcut-title');
		// populate <select>
		$.each(options.profile_names,function(index,value){
			$(shortcutSelect).append('<option value="'+value+'">'+value+'</option>');

		})
		console.log(shortcutName);
		$(shortcutSelect).val(shortcutName);

	}

	var shortcutName = shortcutPanel.attr('data-shortcutName');
	// select on shortcutName

	$(shortcutPanel).children().last().load('keyboard/keyboard.html',function(){
		var keyboardRows = document.querySelectorAll('.keyboard-row');
		for (var i=0; i<keyboardRows.length; i++){
			keyboardRows[i].addEventListener('click', options.keyboardClick);
		}

		document.querySelector('.save-edit-shortcut').addEventListener('click',options.saveEditShortcut);
		document.querySelector('.cancel-edit-shortcut').addEventListener('click',options.cancelEditShortcut);
		document.querySelector('.clear-edit-shortcut').addEventListener('click',options.clearEditShortcut);

		if(!isNew){
			options.recoverShortcutSettings(shortcutName);
		}
	});
}

options.recoverShortcutSettings = function(shortcutName) {
	chrome.storage.sync.get('shortcuts',function(obj){
		if(obj.shortcuts){
			var shortcutCondition = obj.shortcuts[shortcutName].condition;
			options.displayShortcutSettings(shortcutName, shortcutCondition);
		}
	})

}

options.displayShortcutSettings = function(shortcutName, shortcutCondition) {

	var keyboardView = $('div[data-shortcutName='+shortcutName+']').find('.keyboard-view');

	for (var i=0; i<shortcutCondition.length; i++){
		$(keyboardView).find('td[data-keyvalue='+shortcutCondition[i]+']').attr('bold','true');
	};
}

options.keyboardClick = function(event){
	if(event.target !== event.currentTarget){
		var clickedItem = event.target;

		if($(clickedItem).attr('bold') == 'false'){
			$(clickedItem).attr('bold',true)
		} else if($(clickedItem).attr('bold')){
			$(clickedItem).attr('bold',false)
		}

	}
	event.stopPropagation();
}

options.saveEditShortcut = function() {
	// store settings in chrome.storage.sync

	var keyboardElements = $('td.keyboard-element');
	var selectedKeys = [];
	for (var i=0; i<keyboardElements.length; i++){
		var key = keyboardElements[i];
		if($(key).attr('bold')=="true"){
			selectedKeys.push($(key).attr('data-keyvalue'));
		}
	}

	var shortcutPanel = $(event.target).closest('.shortcut-panel');

	if($(shortcutPanel).hasClass('custom-shortcut')) {
		//		update data-shortcutName with whatever is in the select menu
		var shortcutName = $(shortcutPanel).find('select').val();
		$(shortcutPanel).attr('data-shortcutName',shortcutName);

		// add shortcutName to added-shortcut array in storage
		chrome.storage.sync.get('custom',function(obj){
			if(obj.custom){
				options.customShortcutNames = obj.custom;
			}
			options.customShortcutNames.push(shortcutName);
			chrome.storage.sync.set(
			{
					'custom':options.customShortcutNames
			});
		})
	}

	var nameOfShortcutToSave = shortcutPanel.attr('data-shortcutName');

	var shortcutToSave = {
		name: nameOfShortcutToSave,
		condition: selectedKeys
	}
	chrome.storage.sync.get('shortcuts',function(obj){
		if(obj.shortcuts){
			options.currentShortcuts = obj.shortcuts;
		}
		options.currentShortcuts[nameOfShortcutToSave] = shortcutToSave;
		chrome.storage.sync.set(
		{
			'shortcuts': options.currentShortcuts
		});
	});



	options.cancelEditShortcut();
}

options.clearEditShortcut = function(){
	var boldKeyboardElements = $('td.keyboard-element[bold="true"]');
	for (var i=0; i<boldKeyboardElements.length; i++){
		$(boldKeyboardElements[i]).attr('bold','false');
	}
}

options.cancelEditShortcut = function() {
	var shortcutPanel = $(event.target).closest('.shortcut-panel');
	var shortcutName = $(shortcutPanel).attr('data-shortcutName');

	if ($(shortcutPanel).hasClass('custom-shortcut')) {
		// 	replace select with h5
		var shortcutSelect = $(shortcutPanel).find('.shortcut-title')
		$(shortcutSelect).parent().append("<h5 class='shortcut-title'>"+shortcutName+"</h5>")
		$(shortcutSelect).remove();

	}

	$(shortcutPanel).find('.edit-shortcut-button').show();
	$(shortcutPanel).find('.keyboard-view').remove();
	$(shortcutPanel).find('.cancel-edit-shortcut').remove();
	//$(event.target).remove();


}

options.addShortcut = function(){
	options.appendShortcut(true,"",function(){
		$('button.edit-shortcut-button:last')[0].click()
	});

	// click on edit
}

options.appendShortcut = function(isNew, shortcutName, callBack){
	$('#shortcut-list-display').append('<div></div>');

	// load template into div
	var addedShortcutContainer = $('#shortcut-list-display').children().last();
	var addedShortcut = null;
	addedShortcutContainer.load('shortcut.html',function(){
		addedShortcut  = $(addedShortcutContainer).children()[0];
		$(addedShortcut).attr('data-shortcutName',shortcutName);
		$(addedShortcut).find('h5').text(shortcutName);
		// add event listeners to buttons
		var deleteButton = $(addedShortcut).find('button.delete-shortcut-button');
		$(deleteButton).click(function(){
				options.deleteShortcut();
		});

		var editButton = $(addedShortcut).find('button.edit-shortcut-button');
		$(editButton).click(function(){
			options.editShortcut(true);
		})

		callBack();
	});

	if(!isNew){
		options.recoverShortcutSettings(shortcutName);
	}

	return null; // return shortcut div
}

options.deleteShortcut = function() {
	// dialog are you sure?
	// remove shortcut panel from list
}
