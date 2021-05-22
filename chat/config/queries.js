var q = {};

/**
 * User and Org details queries
 */

q.fetch_from_users = 'SELECT recordId,givenName,familyName,email,image,gender FROM records USE KEYS  "{recordId}"';
q.fetch_from_orgs = 'SELECT docType,recordId,name,website,phone,bannerImage,profileImage,about,address FROM records USE KEYS  "{recordId}"';
q.fetch_from_products = 'SELECT name,recordId,productCategory,Manufacturer FROM records USE KEYS  "{recordId}"';
q.fetch_from_specItems = 'SELECT records.* FROM records USE KEYS "{recordId}"';

q.fetch_my_topics_and_chats='SELECT distinct(messages.id),messages.type,messages.userId,messages.message,messages.status,messages.topic,messages.createdDate,messages.contacted,messages.counter '+ 
							'FROM messages '+ 
							'UNNEST messages.contacted contacted '+ 
							'WHERE (contacted.userId = "{userId}" AND contacted.status="pending" ) AND messages.type="Topic" AND (messages.status.`{userId}`.type="pending" OR messages.status.`{userId}`.type="active") '+
							'UNION ALL '+
							'(SELECT chatFrom,chatTo,counter,createdDate,org,status,topic,topicId,type,meta().id,updatedDate '+
							'FROM messages '+ 
							'WHERE type="PersonalChat" AND status.`{userId}`.type="active") '+
							'ORDER BY updatedDate desc ';
q.search_my_topics_and_chats='SELECT distinct(messages.id),messages.type,messages.userId,messages.message,messages.status,messages.topic,messages.createdDate,messages.contacted,messages.counter '+ 
							'FROM messages '+ 
							'UNNEST messages.contacted contacted '+ 
							'WHERE (contacted.userId = "{userId}" AND '+ 
									'contacted.status="pending" ) AND '+
									'messages.type="Topic" AND '+
									'(messages.status.`{userId}`.type="pending" OR messages.status.`{userId}`.type="active") AND '+ 
									'(lower(messages.topic) like "%{searchText}%" ) '+
							'UNION ALL '+
							'(SELECT chatFrom,chatTo,counter,createdDate,org,status,topic,topicId,type,meta().id,updatedDate '+
							'FROM messages '+ 
							'WHERE type="PersonalChat" AND '+
								'status.`{userId}`.type="active" AND '+ 
								'lower(topic) like "%{searchText}%" ) '+
							'ORDER BY updatedDate desc ';

/**
 * Topic Queries
 */

q.fetch_my_orgs =	'SELECT distinct org '+
					'FROM messages '+
					'WHERE type="PersonalChat" AND (chatTo="{userId}" or chatFrom="{userId}") ';//+
					//'ORDER BY updatedDate desc ';

q.fetch_my_topics = 	'SELECT distinct(messages.id),messages.type,messages.userId,messages.message,messages.status,messages.topic,messages.createdDate,messages.contacted,messages.counter '+
						'FROM messages '+
						'UNNEST messages.contacted contacted '+
						'WHERE (contacted.userId = "{userId}" OR messages.userId="{userId}") AND messages.type="Topic" AND (messages.status.`{userId}`.type="active" OR messages.status.`{userId}`.type="pending") '+
						'ORDER BY messages.updatedDate desc';
q.search_my_topics = 	'SELECT distinct(messages.id),messages.type,messages.userId,messages.message,messages.status,messages.topic,messages.createdDate,messages.contacted,messages.counter '+
						'FROM messages '+
						'UNNEST messages.contacted contacted '+
						'WHERE (contacted.userId = "{userId}" OR messages.userId="{userId}") AND messages.type="Topic" AND (messages.status.`{userId}`.type="active" OR messages.status.`{userId}`.type="pending") AND '+
						'(lower(messages.topic) like "%{searchText}%" ) '+
						'ORDER BY messages.updatedDate desc';

q.add_to_topics = 'INSERT INTO messages (KEY, VALUE) VALUES ("{k}", {data});';

q.fetch_topic_by_id =	'SELECT meta().id,type,userId,category,message,status,counter,topic,createdDate,contacted,locationNeeded, project, needDate,quantity '+
						'FROM messages '+
						'WHERE type="Topic" and id="{id}"';

q.fetch_from_my_pending_topics = 'SELECT meta().id,type,userId,message,counter,status,topic,createdDate,contacted,locationNeeded, project, needDate,quantity '+
								'FROM messages '+
								'WHERE type="Topic" AND status.`{userId}`.type="pending" ORDER BY updatedDate DESC';
q.search_from_my_pending_topics = 'SELECT meta().id,type,userId,message,counter,status,topic,createdDate,contacted,locationNeeded, project, needDate,quantity '+
								'FROM messages '+
								'WHERE type="Topic" AND status.`{userId}`.type="pending"  AND lower(topic) like "%{searchText}%" ORDER BY updatedDate DESC';

q.fetch_from_my_archived_topics = 'SELECT meta().id,type,userId,category,message,status,counter,topic,createdDate,contacted,locationNeeded, project, needDate,quantity '+
								 'FROM messages '+
								 'WHERE type="Topic" AND status.`{userId}`.type="archived" ORDER BY updatedDate DESC';

q.search_from_my_archived_topics = 'SELECT meta().id,type,userId,category,message,status,counter,topic,createdDate,contacted,locationNeeded, project, needDate,quantity '+
									'FROM messages '+
									'WHERE type="Topic" AND status.`{userId}`.type="archived" AND lower(topic) like "%{searchText}%" ORDER BY updatedDate DESC';

q.update_topic_status_for_user_in_contacted =	'UPDATE messages '+
									'USE KEYS "{id}" '+
									'SET x.status="{status}" '+
									'FOR x IN contacted WHEN x.userId= "{userId}" AND x.org="{org}" END ';

q.update_topic_status_for_user =	'UPDATE messages '+
									'USE KEYS "{id}" '+
									'SET status.`{userId}`.type="{status}", status.`{userId}`.updatedDate="{date}" ';

q.update_topic_counter_for_user =	'UPDATE messages '+
									'USE KEYS "{id}" '+
									'SET counter.`{userId}`.count=counter.`{userId}`.count+1 , updatedDate="{date}" ';
q.reset_topic_counter_for_user = 'UPDATE messages ' +
								'USE KEYS "{id}" '+
								'SET counter.`{userId}`.count=0  ';

/**
 * Personal Chat Queries
 */

q.fetch_from_my_org_chats = 'SELECT chatFrom,chatTo,counter,createdDate,org,status,topic,topicId,type,meta().id,updatedDate '+
							'FROM messages '+
							'WHERE type="PersonalChat" AND org="{id}" AND (chatTo="{from}" OR chatFrom="{from}") AND  status.`{from}`.type="active" '+
							'ORDER BY updatedDate desc ';

q.fetch_from_chats_by_topic_id	=	'SELECT chatFrom,chatTo,counter,createdDate,org,status,topic,topicId,type,meta().id,updatedDate '+
									'FROM messages '+
									'WHERE type="PersonalChat" AND topicId="{id}" AND status.`{from}`.type="active" '+
									'ORDER BY updatedDate desc ';

q.fetch_from_my_archive_chats = 'SELECT chatFrom,chatTo,counter,createdDate,org,status,topic,topicId,type,updatedDate,meta().id '+
								'FROM messages '+
								'WHERE type="PersonalChat" AND status.`{userId}`.type="archived" '+
								'ORDER BY status.`{userId}`.updatedDate DESC';

q.search_from_my_archive_chats = 'SELECT chatFrom,chatTo,counter,createdDate,org,status,topic,topicId,type,updatedDate,meta().id '+
								'FROM messages '+
								'WHERE type="PersonalChat" AND status.`{userId}`.type="archived" AND lower(topic)  like "%{searchText}%" '+
								'ORDER BY status.`{userId}`.updatedDate DESC';

q.fetch_chat_by_topic_user_org =	'SELECT messages '+
									'FROM messages '+
									'WHERE type="PersonalChat" AND (chatFrom="{from}" OR chatTo="{from}") AND topicId="{id}" AND org="{org}"';

q.new_chat = 'INSERT INTO messages (KEY, VALUE) VALUES ("{k}", {data});';

q.switch_chat_to_user=	'UPDATE messages '+
						'USE KEYS "{id}" '+
						'SET status.`{userId}`.type="active", status.`{userId}`.updatedDate="{date}" ,chatTo="{newUserId}"'
	
q.add_to_chat = 'UPDATE messages '+
				'SET chat = ARRAY_APPEND(chat, {data}), updatedDate="{date}"'+
				'WHERE type="PersonalChat" AND (chatFrom="{from}" OR chatTo="{from}") AND topicId="{id}" AND org="{org}"'+
				'RETURNING *';//chatFrom,chatTo,meta().id';

q.get_chat_by_id =	'SELECT messages FROM messages USE KEYS "{id}"';

q.update_chat_status_for_user =	'UPDATE messages '+
								'USE KEYS "{id}" '+
							 	'SET status.`{userId}`.type="{status}", status.`{userId}`.updatedDate="{date}" , updatedDate="{date}"';

q.reset_chat_counter_for_user = 'UPDATE messages ' +
								'USE KEYS "{id}" '+
								'SET counter.`{userId}`.count=0  ';

q.update_chat_counter_for_user = 'UPDATE messages '+
						'USE KEYS "{id}" '+
						'SET counter.`{userId}`.count=counter.`{userId}`.count+1, updatedDate="{date}"';


q.fetch_my_chat_notifications =	'SELECT topicId, chatFrom, counter '+
								'FROM messages  '+
								'WHERE type="PersonalChat" AND (chatTo= "{userId}" OR chatFrom="{userId}") AND counter.`{userId}`.count>0';

q.fetch_all_my_notfications_count="SELECT sum(counter.`{userId}`.count) as count FROM messages WHERE status.`{userId}`.type!='deleted'"


q.add_to_archive = '';
q.add_to_org_chat = '';
module.exports = q;




/*
CREATE INDEX `chat_type` ON `messages`(`type`) USING GSI;
CREATE INDEX `chat_chatFrom` ON `messages`(`chatFrom`) USING GSI;
CREATE INDEX `chat_chatTo` ON `messages`(`chatTo`) USING GSI;
CREATE INDEX `chat_topicId` ON `messages`(`topicId`) USING GSI;
CREATE INDEX `chat_org` ON `messages`(`org`) USING GSI;
CREATE INDEX `chat_status` ON `messages`(`status`) USING GSI;
CREATE INDEX `chat_topic` ON `messages`(`topic`) USING GSI;

*/