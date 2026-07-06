import { pool } from "../config/db.js";

export const findUserByEmail = async (email) => {
  const query = `SELECT * FROM Asuthentication WHERE email = $1`;
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

export const findUserById = async (id) => {
  const query = `SELECT id, first_name, last_name, email, role, created_at FROM Asuthentication WHERE id = $1`;
  const result = await pool.query(query, [id]);
  return result.rows[0];
};

export const createUser = async (user) => {
  const query = `
    INSERT INTO Asuthentication (first_name, last_name, email, password, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, first_name, last_name, email, role, created_at;
  `;
  const values = [
    user.first_name,
    user.last_name,
    user.email,
    user.password,
    user.role || "customer"
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};