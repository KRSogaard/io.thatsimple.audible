import { MySQLConnection, Pool } from '../config/mysql.config';

export const runQuery = async (sqlQuery: string, values: any | any[]): Promise<any> => {
    return new Promise(function (resolve, reject) {
        MySQLConnection().then((pool) => {
            pool.query(sqlQuery, values, function (error, results, fields) {
                if (error) {
                    reject(error);
                } else resolve(results);
            });
        });
    });
};
