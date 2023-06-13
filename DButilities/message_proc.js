const oracle = require('./db_com.js');

async function MessageStore(msg) {
  if (!validateMessage(msg)) {
    throw new Error('Message format mismatch!');
  }
  let sql = `INSERT INTO SAJET.SJ_APP_MESSAGE
    (MES_CONTENT, MES_TYPE, SENT_TIME, SENDER_ID, RECEIVER_ID, GROUP_ID, MEDIA_ID)
  VALUES
    ('${msg.content}', '${msg.type}', SYSDATE, ${msg.sender}, ${msg.receiver}, ${msg.group_id}, ${msg.media_id}) RETURNING MES_ID INTO :id`;
  try {
    let result = await oracle.InsertReturnID(sql);
    if (result > 0) {
      await MessageUnreadUpdate({ MES_ID: result, EMP_ID: msg.sender, GROUP_ID: msg.group_id });
    }
    console.log(result);
    return result;
  } catch (err) {
    throw err;
  }
}

async function MessageUnreadUpdate(sent_msg, stt = true) {
  let sql = '';
  if (stt) {
    sql = `INSERT INTO SAJET.SJ_APP_MESSAGE_STATUS
    SELECT ${sent_msg.MES_ID} MES_ID, EMP_ID,'1' STATUS,SYSDATE FROM SAJET.SJ_APP_GROUPDETAILS WHERE GROUP_ID = ${sent_msg.GROUP_ID} AND EMP_ID <> ${sent_msg.EMP_ID}`;
    await oracle.executeNonquery(sql);
  } else {
    sql = `DELETE FROM SAJET.SJ_APP_MESSAGE_STATUS WHERE (MESSAGE_ID,EMP_ID) IN
    (SELECT DISTINCT B.MES_ID ,A.EMP_ID FROM SAJET.SJ_APP_GROUPDETAILS A,SAJET.SJ_APP_MESSAGE B
    WHERE A.GROUP_ID = ${sent_msg.GROUP_ID} AND A.GROUP_ID=B.GROUP_ID AND A.EMP_ID = ${sent_msg.EMP_ID})`; 
    await oracle.executeNonquery(sql);
  }
}

async function RecallMessage(msgID) {
  let sql = `UPDATE SAJET.SJ_APP_MESSAGE SET RECALL_STT = 'Y' WHERE MES_ID = ${msgID}`;
  try {
    await oracle.executeNonquery(sql);
    return 'OK';
  } catch (error) {
    throw error;
  }
}

function validateMessage(obj) {
  if (Object.keys(obj).length !== 6) {
    return false;
  }

  if (
    typeof obj.sender !== 'number' ||
    typeof obj.receiver !== 'number'
  ) {
    return false;
  }

  return true;
}

module.exports = {
  MessageStore,
  RecallMessage,
  MessageUnreadUpdate
};