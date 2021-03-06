
'use strict';

const dialogflow = require('dialogflow');
const config = require('./config');
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const uuid = require('uuid');
 //module DB postgres
const pg = require('pg');  
pg.defaults.ssl = true; 

let langue_bot="";

//let dateFormat=require('dateformat');
//let date = require('date-and-time');

// Messenger API parameters
if (!config.FB_PAGE_TOKEN) {
	throw new Error('missing FB_PAGE_TOKEN');
}
if (!config.FB_VERIFY_TOKEN) {
	throw new Error('missing FB_VERIFY_TOKEN');
}
if (!config.GOOGLE_PROJECT_ID) {
	throw new Error('missing GOOGLE_PROJECT_ID');
}
if (!config.DF_LANGUAGE_CODE) {
	throw new Error('missing DF_LANGUAGE_CODE');
}
if (!config.GOOGLE_CLIENT_EMAIL) {
	throw new Error('missing GOOGLE_CLIENT_EMAIL');
}
if (!config.GOOGLE_PRIVATE_KEY) {
	throw new Error('missing GOOGLE_PRIVATE_KEY');
}
if (!config.FB_APP_SECRET) {
	throw new Error('missing FB_APP_SECRET');
}
if (!config.SERVER_URL) { //used for ink to static files
	throw new Error('missing SERVER_URL');
}
if (!config.PG_CONFIG) { //pg config  
    throw new Error('missing PG_CONFIG');  
}
if (!config.SENDGRID_API_KEY) { //sending email  
    throw new Error('missing SENGRID_API_KEY'); 
}  
if (!config.EMAIL_FROM) { //sending email 
    throw new Error('missing EMAIL_FROM'); 
}  
if (!config.EMAIL_TO) { //sending email  
    throw new Error('missing EMAIL_TO'); 
} 


app.set('port', (process.env.PORT || 5000))

//verify request came from facebook
app.use(bodyParser.json({
	verify: verifyRequestSignature
}));

//serve static files in the public directory
app.use(express.static('public'));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
	extended: false
}));

// Process application/json
app.use(bodyParser.json());






const credentials = {
    client_email: config.GOOGLE_CLIENT_EMAIL,
    private_key: config.GOOGLE_PRIVATE_KEY,
};

const sessionClient = new dialogflow.SessionsClient(
	{
		projectId: config.GOOGLE_PROJECT_ID,
		credentials
	}
);


const sessionIds = new Map();

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	console.log("request");
	if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.FB_VERIFY_TOKEN) {
		res.status(200).send(req.query['hub.challenge']);
	} else {
		console.error("Failed validation. Make sure the validation tokens match.");
		res.sendStatus(403);
	}
})

/*
 * All callbacks for Messenger are POST-ed. They will be sent to the same
 * webhook. Be sure to subscribe your app to your page to receive callbacks
 * for your page. 
 * https://developers.facebook.com/docs/messenger-platform/product-overview/setup#subscribe_app
 *
 */
app.post('/webhook/', function (req, res) {
	var data = req.body;
	console.log(JSON.stringify(data));



	// Make sure this is a page subscription
	if (data.object == 'page') {
		// Iterate over each entry
		// There may be multiple if batched
		data.entry.forEach(function (pageEntry) {
			var pageID = pageEntry.id;
			var timeOfEvent = pageEntry.time;

			// Iterate over each messaging event
			pageEntry.messaging.forEach(function (messagingEvent) {
				if (messagingEvent.optin) {
					receivedAuthentication(messagingEvent);
				} else if (messagingEvent.message) {
					receivedMessage(messagingEvent);
				} else if (messagingEvent.delivery) {
					receivedDeliveryConfirmation(messagingEvent);
				} else if (messagingEvent.postback) {
					receivedPostback(messagingEvent);
				} else if (messagingEvent.read) {
					receivedMessageRead(messagingEvent);
				} else if (messagingEvent.account_linking) {
					receivedAccountLink(messagingEvent);
				} else {
					console.log("Webhook received unknown messagingEvent: ", messagingEvent);
				}
			});
		});

		// Assume all went well.
		// You must send back a 200, within 20 seconds
		res.sendStatus(200);
	}
});





function receivedMessage(event) {

	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfMessage = event.timestamp;
	var message = event.message;

	if (!sessionIds.has(senderID)) {
		sessionIds.set(senderID, uuid.v1());
	}
	//console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
	//console.log(JSON.stringify(message));

	var isEcho = message.is_echo;
	var messageId = message.mid;
	var appId = message.app_id;
	var metadata = message.metadata;

	// You may get a text or attachment but not both
	var messageText = message.text;
	var messageAttachments = message.attachments;
	var quickReply = message.quick_reply;

	if (isEcho) {
		handleEcho(messageId, appId, metadata);
		return;
	} else if (quickReply) {
		handleQuickReply(senderID, quickReply, messageId);
		return;
	}


	if (messageText) {
		//send message to api.ai
		sendToDialogFlow(senderID, messageText);
	} else if (messageAttachments) {
		handleMessageAttachments(messageAttachments, senderID);
	}
}
 
 
function handleMessageAttachments(messageAttachments, senderID){
	//for now just reply
	sendTextMessage(senderID, "Attachment received. Thank you.");	
}

function handleQuickReply(senderID, quickReply, messageId) {
	var quickReplyPayload = quickReply.payload;
	console.log("Quick reply for message %s with payload %s", messageId, quickReplyPayload);
	//send payload to api.ai
	sendToDialogFlow(senderID, quickReplyPayload);
}
//https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-echo

function handleEcho(messageId, appId, metadata) {

	// Just logging message echoes to console
	console.log("Received echo for message %s and app %d with metadata %s", messageId, appId, metadata);
}
 
function handleDialogFlowAction(sender, action, messages, contexts, parameters) {
	let obj;
	switch (action) { 
		

				
		case "Espace_Travail_Request_Modif.Espace_Travail_Request_Modif_batiment":
				var z=0;
				let replies1 = [];
 				let title1='Choisis dans la liste :';
				while(obj!=false){
					obj=isDefined(contexts[z]);
					if(obj){
						if(JSON.stringify(contexts[z].name).includes('espace_travail_request_modif_batiment_dialog_params_batiment')){
							let bat = ['JA','JQ','JBC','GEN','CHA','LEU','LIE','MAR','PN','VEL','YE'];//liste des batiments (Stock assets et ROE-M retiré pcq trop de quick replies)
							
							/*if(langue_bot=='en')  {
								title1='Choose in the list :';
								}
							else if( langue_bot=='nl'){
								title1='Kies uit de lijst :';
							}*/
							var b;
							for( b=0;b<bat.length;b++){
								
								let reply = {
										"content_type": "text",
										"title": bat[b],
										"payload": bat[b]
									    }
								replies1.push(reply);
												
							}
							
						   }
					}
					
					
					z=z+1;
					
				} 
				handleMessages(messages, sender);
				if(replies1.length!=0){					
					sendQuickReply(sender,title1,replies1);
					}
				break;
		case "Espace_travail_request":
				
				var q=0;
				let replies = [];
				let title='Choisis dans la liste :';
				while(obj!=false){
					obj=isDefined(contexts[q]);
					
					if(obj){
						if(JSON.stringify(contexts[q].name).includes('espace_travail_request_dialog_params_batiment')){
							
							let bat = ['JA','JQ','JBC','GEN','CHA','LEU','LIE','MAR','PN','VEL','YE'];//liste des batiments (Stock assets et ROE-M retiré pcq trop de quick replies)
							//let replies = [];
							//let title='Choisis dans la liste :';
							/*if(langue_bot=='en')  {
								title='Choose in the list :';
								}
							else if( langue_bot=='nl'){
								title='Kies uit de lijst :';
							}*/
							var b;
							
							for( b=0;b<bat.length;b++){
								console.log("Loop For Espace Travail");
								let reply = {
										"content_type": "text",
										"title": bat[b],
										"payload": bat[b]
									    }
								replies.push(reply);
												
							}
							
						   }
					}
					
					
					q=q+1;
					
				}
				handleMessages(messages, sender);
				if(replies.length!=0){
					//Attend que handleMessages se soit exécuté
					setTimeout(sendQuickReply,2000,sender,title,replies);
					}
				break;
		case "input.welcome":
				
				greetUserText(sender);break;
			
		case "Espace_Travail_Request_Validation":
			//sender, action, messages, contexts, parameters
				//let snd=sender;
			    	//let action=isDefined(action);
				//let contexts=isDefined(contexts);
				//let msg=messages;
				//let parameters=isDefined(parameters);
				//console.log("sender : "+snd+" || action : "+action+" || contexts : "+contexts+" || Messages : "+msg+" || parameters : "+parameters);
			   	//console.log("sender : "+snd+" || Messages : "+JSON.stringify(msg)+" || action : "+action+" || contexts : "+JSON.stringify(contexts));
				   console.log(JSON.stringify(contexts[0].parameters));
				
				
			// Parcourt tous les contextes pour trouver le bon qui contient les paramètres dont on a besoin
				
				var j=0;
				var i=0;
				
				while(obj!=false){
					obj=isDefined(contexts[i]);
					//console.log('obj : '+obj);
					//console.log('json : '+JSON.stringify(contexts[i].name));
					if(obj){
						if(JSON.stringify(contexts[i].name).includes('espace_travail_request-followup')){

							j=i;
							break;

						   }
					}
					i=i+1;
					
				}
			
			
				    //let date= dateFormat(now,"isoDate");
				    /*try {
				    //let categorie=contexts[0].parameters.fields['Espace_confort'];
				    	let categorie=contexts[0];
				    }
				    catch(err){
					    console.log("------>Erreur action Validation : "+err.message+"\n context : "+categorie);
				    }*/
				    //let dateToday= date.format(new Date(), 'YYYY/MM/DD');    
				   // let date= "15/11/2018";
				    
				    let nom=contexts[j].parameters.fields['nom'].stringValue.trim().toLowerCase().replace(","," ");
				    let prenom=contexts[j].parameters.fields['prenom'].stringValue.trim().toLowerCase().replace(","," ");
					nom=nom.charAt(0).toUpperCase()+nom.slice(1);
					prenom=prenom.charAt(0).toUpperCase()+prenom.slice(1);
				    let email=contexts[j].parameters.fields['email'].stringValue;
				    let categorie=contexts[j].parameters.fields['Espace_confort'].stringValue;
				    let catOrig=contexts[j].parameters.fields['Espace_confort.original'].stringValue;
					if (catOrig==categorie){catOrig="";}
					else {catOrig="("+catOrig+")";}
				    let commentaire=contexts[j].parameters.fields['description'].stringValue.replace(","," ");
				    let batiment=contexts[j].parameters.fields['batiment'].stringValue
				    let etage=contexts[j].parameters.fields['etage'].stringValue;
				    let batiEtage=batiment+etage;
				    let paramJson=JSON.stringify(contexts[j].parameters);
				   // let paramJson=contexts[0].parameters;
				    let dateR = new Date();
				    let jour= dateR.getDate();
				    let mois= dateR.getMonth()+1;
 				    let année= dateR.getFullYear();
				    let heure= dateR.getHours();
				    let minute= dateR.getMinutes();
				    let dateFormat=jour+"/"+mois+"/"+année+" "+heure+":"+minute;
				    console.log(dateFormat);
				   /* let emailContent = 	'<!DOCTYPE html>'+
							'<html>'+
							'<head>'+
							'<style>'+
							'table, th, td {'+
							   ' border: 1px solid blue;}'+
							'table {'+
 								'width: 100%;}'+
							'</style>'+
							'</head>'+
							'<body>'+
							'<h2>Nouvelle Requête N°000102</h2>'+ 
						        '<div>'+
								'Bonjour Oussama,<br><br>'+
								'Ta requête vient d\'être enregistrée et sera traitée dans les plus brefs délais<br><br>'+
								'Bien à toi <br><br>'+
							'</div>'+ 
							'<table> '+
 							'<tr>'+
   							 '<th>Référence</th>'+
							 '<td>000102</td>'+
							'</tr>'+
							'<tr>'+
   							 '<th>Demandeur</th>'+
							 '<td>'+demandeur+'</td>'+
							'</tr>'+
							'<tr>'+
    							 '<th>Date</th>'+
							 '<td>'+dateFormat+'</td>'+
							'</tr>'+
							'<tr>'+
    							 '<th>Catégorie</th>'+
							 //'<td>Catégorie</td>'+
							'<td>'+categorie+' '+catOrig+'</td>'+
							'</tr>'+
							'<tr>'+
    							 '<th>Commentaire</th>'+
							//' <td>Commentaire</td>'+
							'<td>'+commentaire+'</td>'+
							'</tr>'+
							'<tr>'+
    							' <th>Bâtiment</th>'+
							 '<td>'+batiEtage+'</td>'+
							//'<td>Bâtiment</td>'+
							'</tr> 	'+
							'<tr> '+
								'<th>Json</th>'+
								'<td width=" 50%">'+paramJson+'</td>'+
				    			'</tr>'
							'</table>'+
							'</body>'+
							'</html>'; */
							 
				 /* let emailContent = '<?xml version="1.0" encoding="UTF-8"?>\n'+
				      			'<REQUETE>\n'+
				      			'<DEMANDEUR>'+nom+' '+prenom+'</DEMANDEUR>\n'+
				      			'<DATE>'+dateFormat+'</DATE>\n'+
				      			'<CATEGORIE>'+categorie+'</CATEGORIE>\n'+
				      			'<CATEGORIEORIGINALE>'+catOrig+'</CATEGORIEORIGINALE>\n'+
				      			'<COMMENTAIRE>'+commentaire+'</COMMENTAIRE>\n'+
				      			'<BATIMENT>'+batiment+'</BATIMENT>\n'+
				      			'<ETAGE>'+etage+'</ETAGE>\n'+				      			      			
				      			'</REQUETE>'; */
				let emailContent = nom+","+prenom+","+categorie+","+commentaire+","+batiment+","+etage;
  
                   		   sendEmail('Facility request', emailContent); 
		                   handleMessages(messages, sender); 
				
			
				//envoie requête base de donnée
			
				var pool = new pg.Pool(config.PG_CONFIG);
				pool.connect(function(err, client, done) {

   				 if (err) {

        				return console.error('Error acquiring client', err.stack);
   				 } else {
				 let senderID=parseInt(sender);	 
				 client.query(`SELECT id FROM public.users WHERE fb_id='${senderID}' LIMIT 1`,  
                       		 function(err, result) {  
                            		if (err) {  
                                		console.log('Query error: ' + err); 
                            		} else {
						//console.log(' result[0] DB :'+ result[0] + ' Result type : '+ typeof result);
						let id_users=result.rows[0].id;  
    						let sql = 'INSERT INTO requests ( id_users, categorie, email, categorie_originale, '+
						    	'batiment, etage, description, date ) ' +
        						'VALUES ($1, $2, $3, $4 , $5 , $6, $7, $8 )';

   						 client.query(sql,
        						[
           				 			id_users,
							 	categorie,
							 	email,
							 	catOrig,
							 	batiment,
							 	etage,
							 	commentaire,
								dateR
                   
        						]);
						}
				
					      });
				 }
						});
						pool.end();  break;
						
		default:
			//unhandled action, just send back the text
           		 handleMessages(messages, sender);
		}
}

function sendEmail(subject, content) { 

    console.log('sending email'); 
    var helper = require('sendgrid').mail; 
    var from_email = new helper.Email(config.EMAIL_FROM); 
    var to_email = new helper.Email(config.EMAIL_TO); 
    var subject = subject; 
    var content = new helper.Content("text/html", content); 
    var mail = new helper.Mail(from_email, subject, to_email, content); 
    var sg = require('sendgrid')(config.SENDGRID_API_KEY); 
    var request = sg.emptyRequest({ 
        method: 'POST', 
        path: '/v3/mail/send', 
        body: mail.toJSON() 
    }); 
 
    sg.API(request, function(error, response) { 

        console.log(response.statusCode) 
        console.log(response.body) 
        console.log(response.headers) 
    }); 
 
} 

function handleMessage(message, sender) {
    switch (message.message) {
        case "text": //text
            message.text.text.forEach((text) => {
                if (text !== '') {
                    sendTextMessage(sender, text);
                }
            });
            break;
        case "quickReplies": //quick replies
            let replies = [];
            message.quickReplies.quickReplies.forEach((text) => {
                let reply =
                    {
                        "content_type": "text",
                        "title": text,
                        "payload": text
                    }
                replies.push(reply);
            });
            sendQuickReply(sender, message.quickReplies.title, replies);
            break;
        case "image": //image
            sendImageMessage(sender, message.image.imageUri);
            break;
    }
}


function handleCardMessages(messages, sender) {

	let elements = [];
	for (var m = 0; m < messages.length; m++) {
		let message = messages[m];
		let buttons = [];
        for (var b = 0; b < message.card.buttons.length; b++) {
            let isLink = (message.card.buttons[b].postback.substring(0, 4) === 'http');
            let button;
            if (isLink) {
                button = {
                    "type": "web_url",
                    "title": message.card.buttons[b].text,
                    "url": message.card.buttons[b].postback
                }
            } else {
                button = {
                    "type": "postback",
                    "title": message.card.buttons[b].text,
                    "payload": message.card.buttons[b].postback
                }
            }
            buttons.push(button);
        }


		let element = {
            "title": message.card.title,
            "image_url":message.card.imageUri,
            "subtitle": message.card.subtitle,
			"buttons": buttons
		};
		elements.push(element);
	}
	sendGenericMessage(sender, elements);
}


function handleMessages(messages, sender) {
    let timeoutInterval = 1100;
    let previousType ;
    let cardTypes = [];
    let timeout = 0;
    for (var i = 0; i < messages.length; i++) {

        if ( previousType == "card" && (messages[i].message != "card" || i == messages.length - 1)) {
            timeout = (i - 1) * timeoutInterval;
            setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
            cardTypes = [];
            timeout = i * timeoutInterval;
            setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
        } else if ( messages[i].message == "card" && i == messages.length - 1) {
            cardTypes.push(messages[i]);
            timeout = (i - 1) * timeoutInterval;
            setTimeout(handleCardMessages.bind(null, cardTypes, sender), timeout);
            cardTypes = [];
        } else if ( messages[i].message == "card") {
            cardTypes.push(messages[i]);
        } else  {

            timeout = i * timeoutInterval;
            setTimeout(handleMessage.bind(null, messages[i], sender), timeout);
        }

        previousType = messages[i].message;

    }
}

function handleDialogFlowResponse(sender, response) {
    let responseText = response.fulfillmentMessages.fulfillmentText;

    let messages = response.fulfillmentMessages;
    let action = response.action;
    let contexts = response.outputContexts;
    let parameters = response.parameters;

	sendTypingOff(sender);

    if (isDefined(action)) {
        handleDialogFlowAction(sender, action, messages, contexts, parameters);
    } else if (isDefined(messages)) {
        handleMessages(messages, sender);
	} else if (responseText == '' && !isDefined(action)) {
		//dialogflow could not evaluate input.
		sendTextMessage(sender, "I'm not sure what you want. Can you be more specific?");
	} else if (isDefined(responseText)) {
		sendTextMessage(sender, responseText);
	}
}

async function sendToDialogFlow(sender, textString, params) {

    sendTypingOn(sender);

    try {
        const sessionPath = sessionClient.sessionPath(
            config.GOOGLE_PROJECT_ID,
            sessionIds.get(sender)
        );
	    //Si User n'a pas changer la langue, on prend langue par défaut
	if(langue_bot==""){
		langue_bot=config.DF_LANGUAGE_CODE;
	}
        const request = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: textString,
                    languageCode: langue_bot,
                },
            },
            queryParams: {
                payload: {
                    data: params
                }
            }
        };
        const responses = await sessionClient.detectIntent(request);

        const result = responses[0].queryResult;
        handleDialogFlowResponse(sender, result);
    } catch (e) {
        console.log('error');
        console.log(e);
    }

}




function sendTextMessage(recipientId, text) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text
		}
	}
	callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
function sendImageMessage(recipientId, imageUrl) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: imageUrl
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a Gif using the Send API.
 *
 */
function sendGifMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "image",
				payload: {
					url: config.SERVER_URL + "/assets/instagram_logo.gif"
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send audio using the Send API.
 *
 */
function sendAudioMessage(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "audio",
				payload: {
					url: config.SERVER_URL + "/assets/sample.mp3"
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example videoName: "/assets/allofus480.mov"
 */
function sendVideoMessage(recipientId, videoName) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "video",
				payload: {
					url: config.SERVER_URL + videoName
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a video using the Send API.
 * example fileName: fileName"/assets/test.txt"
 */
function sendFileMessage(recipientId, fileName) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "file",
				payload: {
					url: config.SERVER_URL + fileName
				}
			}
		}
	};

	callSendAPI(messageData);
}



/*
 * Send a button message using the Send API.
 *
 */
function sendButtonMessage(recipientId, text, buttons) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: text,
					buttons: buttons
				}
			}
		}
	};

	callSendAPI(messageData);
}


function sendGenericMessage(recipientId, elements) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "generic",
					elements: elements
				}
			}
		}
	};

	callSendAPI(messageData);
}


function sendReceiptMessage(recipientId, recipient_name, currency, payment_method,
							timestamp, elements, address, summary, adjustments) {
	// Generate a random receipt ID as the API requires a unique ID
	var receiptId = "order" + Math.floor(Math.random() * 1000);

	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "receipt",
					recipient_name: recipient_name,
					order_number: receiptId,
					currency: currency,
					payment_method: payment_method,
					timestamp: timestamp,
					elements: elements,
					address: address,
					summary: summary,
					adjustments: adjustments
				}
			}
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
function sendQuickReply(recipientId, text, replies, metadata) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			text: text,
			metadata: isDefined(metadata)?metadata:'',
			quick_replies: replies
		}
	};

	callSendAPI(messageData);
}

/*
 * Send a read receipt to indicate the message has been read
 *
 */
function sendReadReceipt(recipientId) {

	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "mark_seen"
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {


	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_on"
	};

	callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {


	var messageData = {
		recipient: {
			id: recipientId
		},
		sender_action: "typing_off"
	};

	callSendAPI(messageData);
}

/*
 * Send a message with the account linking call-to-action
 *
 */
function sendAccountLinking(recipientId) {
	var messageData = {
		recipient: {
			id: recipientId
		},
		message: {
			attachment: {
				type: "template",
				payload: {
					template_type: "button",
					text: "Welcome. Link your account.",
					buttons: [{
						type: "account_link",
						url: config.SERVER_URL + "/authorize"
          }]
				}
			}
		}
	};

	callSendAPI(messageData);
}


function greetUserText(userId) {
	//first read user firstname
	request({
		uri: 'https://graph.facebook.com/v2.7/' + userId,
		qs: {
			access_token: config.FB_PAGE_TOKEN
		}

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var user = JSON.parse(body);
			if (user.first_name) {
				var pool = new pg.Pool(config.PG_CONFIG); 
                		pool.connect(function(err, client, done) { 
 
                    		if (err) { 
 
                        	return console.error('Error acquiring client', err.stack);  
                    		}  
                    		var rows = []; 
 
                    		client.query(`SELECT fb_id FROM users WHERE fb_id='${userId}' LIMIT 1`,  
                       		 function(err, result) {  
                            		if (err) {  
                                		console.log('Query error: ' + err); 
                            		} else {  
                                		if (result.rows.length === 0) {  
 		                                   let sql = 'INSERT INTO users (fb_id, first_name, last_name, profile_pic) ' + 
										'VALUES ($1, $2, $3, $4)'; 
 
		                                    client.query(sql, 
		                                        [ 
		                                            userId, 
		                                            user.first_name, 
		                                            user.last_name, 
		                                            user.profile_pic 
		                                        ]); 
		                                } 
	                            } 

                        }); 
 
                }); 


 
                pool.end(); 

				sendTextMessage(userId, "Hello " + user.first_name + '! :) ');
			} else {
				console.log("Cannot get data for fb user with id",
					userId);
			}
		} else {
			console.error(response.error);
		}

	});
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll 
 * get the message id in a response 
 *
 */
function callSendAPI(messageData) {
	request({
		uri: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {
			access_token: config.FB_PAGE_TOKEN
		},
		method: 'POST',
		json: messageData

	}, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var recipientId = body.recipient_id;
			var messageId = body.message_id;

			if (messageId) {
				console.log("Successfully sent message with id %s to recipient %s",
					messageId, recipientId);
			} else {
				console.log("Successfully called Send API for recipient %s",
					recipientId);
			}
		} else {
			console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
		}
	});
}



/*
 * Postback Event
 *
 * This event is called when a postback is tapped on a Structured Message. 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/postback-received
 * 
 */
function receivedPostback(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfPostback = event.timestamp;

	// The 'payload' param is a developer-defined field which is set in a postback 
	// button for Structured Messages. 
	var payload = event.postback.payload;
	//C'est ici qu'on reçoit le choix de la langue du User lorsqu'il sélectionne qqch dans le menu "langue"
	switch (payload) {
		case "LANG_FR" : langue_bot="fr";
				 sendTextMessage(senderID, "Langue : 🇫🇷 Français"); break;
		case "LANG_NL" : langue_bot="nl";
				 sendTextMessage(senderID, "Taal : 🇳🇱 Nederlands");break;
		case "LANG_EN" : langue_bot="en";
				 sendTextMessage(senderID, "Language : 🇬🇧 English");break;
		case "<GET_STARTED_PAYLOAD>": greetUserText(senderID);break;
			
		default:
			//unindentified payload
			sendTextMessage(senderID, "Hein!?");
			break;

	}

	console.log("Received postback for user %d and page %d with payload '%s' " +
		"at %d", senderID, recipientID, payload, timeOfPostback);

}


/*
 * Message Read Event
 *
 * This event is called when a previously-sent message has been read.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-read
 * 
 */
function receivedMessageRead(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	// All messages before watermark (a timestamp) or sequence have been seen.
	var watermark = event.read.watermark;
	var sequenceNumber = event.read.seq;

	console.log("Received message read event for watermark %d and sequence " +
		"number %d", watermark, sequenceNumber);
}

/*
 * Account Link Event
 *
 * This event is called when the Link Account or UnLink Account action has been
 * tapped.
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/account-linking
 * 
 */
function receivedAccountLink(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;

	var status = event.account_linking.status;
	var authCode = event.account_linking.authorization_code;

	console.log("Received account link event with for user %d with status %s " +
		"and auth code %s ", senderID, status, authCode);
}

/*
 * Delivery Confirmation Event
 *
 * This event is sent to confirm the delivery of a message. Read more about 
 * these fields at https://developers.facebook.com/docs/messenger-platform/webhook-reference/message-delivered
 *
 */
function receivedDeliveryConfirmation(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var delivery = event.delivery;
	var messageIDs = delivery.mids;
	var watermark = delivery.watermark;
	var sequenceNumber = delivery.seq;

	if (messageIDs) {
		messageIDs.forEach(function (messageID) {
			console.log("Received delivery confirmation for message ID: %s",
				messageID);
		});
	}

	console.log("All message before %d were delivered.", watermark);
}

/*
 * Authorization Event
 *
 * The value for 'optin.ref' is defined in the entry point. For the "Send to 
 * Messenger" plugin, it is the 'data-ref' field. Read more at 
 * https://developers.facebook.com/docs/messenger-platform/webhook-reference/authentication
 *
 */
function receivedAuthentication(event) {
	var senderID = event.sender.id;
	var recipientID = event.recipient.id;
	var timeOfAuth = event.timestamp;

	// The 'ref' field is set in the 'Send to Messenger' plugin, in the 'data-ref'
	// The developer can set this to an arbitrary value to associate the 
	// authentication callback with the 'Send to Messenger' click event. This is
	// a way to do account linking when the user clicks the 'Send to Messenger' 
	// plugin.
	var passThroughParam = event.optin.ref;

	console.log("Received authentication for user %d and page %d with pass " +
		"through param '%s' at %d", senderID, recipientID, passThroughParam,
		timeOfAuth);

	// When an authentication is received, we'll send a message back to the sender
	// to let them know it was successful.
	sendTextMessage(senderID, "Authentication successful");
}

/*

* Verify that the callback came from Facebook. Using the App Secret from 
 * the App Dashboard, we can verify the signature that is sent with each 
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
	var signature = req.headers["x-hub-signature"];
	/*ajout perso test
	console.log("signature : "+signature);
	console.log("request : "+JSON.stringify(req.headers));
	*/
	
	if (!signature) {
		
		throw new Error('Couldn\'t validate the signature.');
	} else {
		var elements = signature.split('=');
		var method = elements[0];
		var signatureHash = elements[1];

		var expectedHash = crypto.createHmac('sha1', config.FB_APP_SECRET)
			.update(buf)
			.digest('hex');

		if (signatureHash != expectedHash) {
			throw new Error("Couldn't validate the request signature.");
		}
	}
}

function isDefined(obj) {
	if (typeof obj == 'undefined') {
		return false;
	}

	if (!obj) {
		return false;
	}

	return obj != null;
}



// Spin up the server
app.listen(app.get('port'), function () {
	console.log('running on port', app.get('port'))
})
