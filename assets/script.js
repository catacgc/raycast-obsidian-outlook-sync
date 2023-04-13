'use strict';


function run() {
	var app = Application.currentApplication()
	app.includeStandardAdditions = true

	var Mail = Application('com.apple.mail')
	var todo = Mail.accounts()[0].mailboxes().find(it => it.name() === "ToDo");

	var results = [];
	for (var m of todo.messages()) {
	results.push(
		{
					id: m.id(),
					subject: m.subject(),
					link: `message://<${m.messageId()}>`
		}

			);	
	}


	return JSON.stringify(results);
}