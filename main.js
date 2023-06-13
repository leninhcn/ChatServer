require('dotenv').config()
const oracle = require('./DButilities/db_com.js');
const mesproc = require('./DButilities/message_proc.js');

const msg = {
    content: 'test message content',
    type: 'text', sender: 12345678, receiver: 3333, group_id: 0, media_id: 0
};
mesproc.MessageStore(msg);
// async function test() {
//     // Tạo kết nối
//     const connection = await oracle.createConnection();

//     // Truy vấn dữ liệu
//     await oracle.selectData(connection, "SELECT * FROM SAJET.G_SN_STATUS WHERE SERIAL_NUMBER = 'GGC1UC011104000N'");

//     // Đóng kết nối
//     await connection.close();
// }

// test();