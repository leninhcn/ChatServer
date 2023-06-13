require('dotenv').config()

const oracledb = require('oracledb');

//let connection = undefined;

// Tạo kết nối đến Oracle Database
async function createConnection() {
  try {
    const conn = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_HOST,
    });

    console.log('Connected to Oracle Database');
    return conn;

  } catch (err) {
    console.error(err.message);
  }
}

async function InsertReturnID(sql, CreateConn = true, conn = undefined) {
  try {
    let connection = conn;
    if (CreateConn) connection = await createConnection();
    const result = await connection.execute(sql, [{ dir: oracledb.BIND_OUT, type: oracledb.NUMBER }]
    );
    if (CreateConn) {
      await connection.commit();
      await closeConnection(connection);
    }
    return result.outBinds[0];

  } catch (err) {
    if (CreateConn) {
      await connection.rollback();
      await closeConnection(connection);
    }
    console.error(err);
  }
}

function ValueByColumnName(data, row_id, columnName) {
  const columnIndex = data.metaData.findIndex(column => column.name === columnName);
  return data.rows[row_id][columnIndex];
}

// Truy vấn dữ liệu và trả về kết quả
async function selectData(sql, CreateConn = true, conn=undefined) {
  try {
    let connection =conn;
    if (CreateConn) connection = await createConnection();
    const result = await connection.execute(sql);
    // console.log('Query result:', ValueByColumnName(result, 0, 'SERIAL_NUMBER'));
    if (CreateConn) {
      await closeConnection(connection);
    }
    return result;

  } catch (err) {
    if (CreateConn) {
      await connection.rollback();
      await closeConnection(connection);
    }
    console.error(err.message);
  }
}

// Thực thi câu lệnh SQL và trả về kết quả
async function executeNonquery(sql, CreateConn = true, conn = undefined) {
  try {
    let connection = conn;
    if (CreateConn) connection = await createConnection();
    await connection.execute(sql);
    if (CreateConn) {
      await connection.commit();
      await closeConnection(connection);
    }
    return 'OK';

  } catch (err) {
    if (CreateConn) {
      await connection.rollback();
      await closeConnection(connection);
    }
    console.error(err.message);
    return err.message;
  }
}

async function executeProcedure1() {
  let connection;

  try {
    connection = await createConnection();

    const procedureName = 'SAJET.LOGIN';
    const bindParams = {
      TEMPNO: '91023991',
      TEMPPWD: 'Leninhcn1606!@#',
      TRES: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
      TEMPID: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
      TEMPNAME: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
    };

    await connection.execute(`BEGIN ${procedureName}(:TEMPNO, :TEMPPWD, :TRES, :TEMPID, :TEMPNAME); END;`, bindParams);

    // Lấy giá trị trả về từ các tham số OUT
    const { TRES, TEMPID, TEMPNAME } = bindParams;

    console.log(TRES);

    console.log('Giá trị trả về từ TEMPNAME:', TEMPNAME);

  } catch (error) {
    console.error('Lỗi khi thực thi thủ tục:', error);

  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Lỗi khi đóng kết nối:', error);
      }
    }
  }
}

// Thực thi store procedure và trả về kết quả
async function executeProcedure(procedureName, inputParams, outputParams,
   CreateConn = true, conn=undefined) {
  try {
    let connection = conn;
    if (CreateConn) connection = await createConnection();
    const result = await connection.execute(
      `BEGIN ${procedureName}(${inputParams}, ${outputParams}); END;`
    );
    if (CreateConn) await closeConnection(connection);
    console.log('Procedure result:', result.outBinds);
    return result.outBinds;

  } catch (err) {
    if (CreateConn) {
      await connection.rollback();
      await closeConnection(connection);
    }
    console.error(err.message);
  }
}

async function closeConnection(conn) {
  try {
    if (conn)
      await conn.close();
    console.log('Disconnected from database');
  } catch (err) {
    console.error('Error while closing database connection', err);
    throw err;
  }
}

module.exports = {
  createConnection,
  selectData,
  executeNonquery,
  executeProcedure,
  closeConnection,
  InsertReturnID
};

executeProcedure1();