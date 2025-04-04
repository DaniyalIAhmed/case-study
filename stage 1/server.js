import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
const PORT = 4601;
const app = express();
app.use(express.json());
app.use(cors());
const db = new sqlite3.Database('./kiryanaDb.db', (err) => {
  if (err) {
    console.error('Error opening database ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});
db.run(`create table if not exists products (id integer primary key autoincrement, name text not null, price number not null, quantity number not null)`,(err)=>console.log(err));
db.run(`create table if not exists stock_movements (stock_id integer primary key autoincrement, product_id integer, quantity number, status text check(status in ('restock', 'sale', 'manual remove')), foreign key (product_id) references products(id))`,(err)=>console.log(err));
app.post('/add/product', (req, res) => {
    try {
        const { name, price, quantity} = req.body;
        if(!name || !price || !quantity) {
          return res.status(400).send({success: false, message:'Please provide name, price and quantity of the product before adding it.'});
        }
        const selectSql = `SELECT id, name, quantity FROM products WHERE name = ?`;
        db.get(selectSql, [name], function (err, row) {
            if (err){
                return res.status(500).send('Error retrieving product');
            }
            if (row){
                return res.status(400).send({success: false, message:'Product already exists'});
            } 

            const sql = `insert into products(name, price, quantity) values(?, ?, ?)`;
            db.run(sql, [name, price, quantity], function (err) {
                if (err){
                    return res.status(500).send('Error adding product');
                } 
                return res.status(200).send({success: true, id: this.lastID});
            });
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send('Server error');
    }
});
app.put('/update/quantity', (req, res) => {
  try {
      const { name, quantity, status } = req.body;
      if (quantity === undefined || !status) {
          return res.status(400).send({ success: false, message: 'Quantity and status are required' });
      }
      const selectSql = `SELECT id, name, quantity FROM products WHERE name = ?`;
      db.get(selectSql, [name], function (err, row) {
          if (err) {
              return res.status(500).send('Error retrieving product');
          }
          if (!row) {
              return res.status(404).send({ success: false, message: 'Product not found' });
          }
          const { id, quantity: currentQuantity } = row;
          let newQuantity = currentQuantity;
          if (status !=='restock') {
              if (currentQuantity < quantity) {
                  return res.status(400).send({ success: false, message: 'Not enough stock to sell' });
              }
              newQuantity = currentQuantity - quantity;
          } else if (status === 'restock') {
              newQuantity = currentQuantity + quantity;
          } else {
              return res.status(400).send({ success: false, message: 'Invalid status' });
          }
          const updateSql = `UPDATE products SET quantity = ? WHERE id = ?`;
          db.run(updateSql, [newQuantity, id], function (err) {
              if (err) {
                  return res.status(500).send('Error updating product quantity');
              }
              const insertMovementSql = `INSERT INTO stock_movements (product_id, quantity, status) VALUES (?, ?, ?)`;
              db.run(insertMovementSql, [id, quantity, status], function (err) {
                  if (err) {
                      return res.status(500).send('Error recording stock movement');
                  }
                  return res.status(200).send({
                      success: true,
                      message: `Quantity updated successfully and movement recorded`,
                      changes: this.changes,
                  });
              });
          });
      });
  } catch (err) {
      console.error(err);
      return res.status(500).send('Server error');
  }
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
