import { pool } from "../config/db.js";

// Create Food
export const createFood = async (req, res, next) => {
  const { name, color, price, carbs, origin_country } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO food (name, color, price, carbs, origin_country)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, color, price ? Number(price) : null, carbs ? Number(carbs) : null, origin_country]
    );

    res.status(201).json({
      status: "success",
      message: "Food item created successfully",
      data: { food: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Get All Foods
export const getAllFoods = async (req, res, next) => {
  try {
    const result = await pool.query("SELECT * FROM food ORDER BY id ASC");
    res.status(200).json({
      status: "success",
      results: result.rows.length,
      data: { foods: result.rows }
    });
  } catch (error) {
    next(error);
  }
};

// Get Food By Id
export const getFoodById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM food WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: `Food item with ID ${id} not found`
      });
    }
    res.status(200).json({
      status: "success",
      data: { food: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Update Food
export const updateFood = async (req, res, next) => {
  const { id } = req.params;
  const { name, color, price, carbs, origin_country } = req.body;
  try {
    const result = await pool.query(
      `UPDATE food 
       SET name = $1, color = $2, price = $3, carbs = $4, origin_country = $5
       WHERE id = $6
       RETURNING *`,
      [name, color, price ? Number(price) : null, carbs ? Number(carbs) : null, origin_country, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: `Food item with ID ${id} not found`
      });
    }

    res.status(200).json({
      status: "success",
      message: "Food item updated successfully",
      data: { food: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Delete Food
export const deleteFood = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM food WHERE id = $1 RETURNING *", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: `Food item with ID ${id} not found`
      });
    }
    res.status(200).json({
      status: "success",
      message: "Food item deleted successfully",
      data: { food: result.rows[0] }
    });
  } catch (error) {
    next(error);
  }
};
