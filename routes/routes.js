const express = require('express');
const router = express.Router();
const { encryptCreditCard, decryptCreditCard } = require('../encryption');
// Import database connection
const db = require('../databse/db');

// Party (Person) routes
router.get('/parties', getParties);
router.get('/parties/:id', getPartyById);
router.post('/parties', createParty);
router.put('/parties/:id', updateParty);
router.delete('/parties/:id', deleteParty);
router.post('/orders', createOrder);
router.post('/orders/:orderId/items', addOrderItems);
router.get('/orders', getAllOrders);

router.put('/orders/:orderId', updateOrder);

async function getParties(req, res) {
    try {
      const [results] = await db.execute('SELECT * FROM party');
      res.json(results);
    } catch (err) {
      console.error('Error fetching parties:', err);
      res.status(500).send('Error fetching parties');
    }
  }
  
  async function getPartyById(req, res) {
    try {
      const id = req.params.id;
      const [result] = await db.execute('SELECT * FROM party WHERE party_id = ?', [id]);
      if (result.length === 0) {
        return res.status(404).send('Party not found');
      }
      res.json(result[0]);
    } catch (err) {
      console.error('Error fetching party:', err);
      res.status(500).send('Error fetching party');
    }
  }
  
  async function createParty(req, res) {
    try {
      const { name, address, contact_info } = req.body;
  
      // Validate required fields
      if (!name || !address || !contact_info) {
        return res.status(400).send('Missing required fields');
      }
  
      const [result] = await db.execute('INSERT INTO party (name, address, contact_info) VALUES (?, ?, ?)', [name, address, contact_info]);
      res.json({ id: result.insertId });
    } catch (err) {
      console.error('Error creating party:', err);
      res.status(500).send('Error creating party');
    }
  }

  async function updateParty(req, res) {
    try {
      const id = req.params.id;
      const { name, address, contact_info } = req.body;
  
      // Validate required fields
      if (!name || !address || !contact_info) {
        return res.status(400).send('Missing required fields');
      }
  
      const [result] = await db.execute('UPDATE party SET name = ?, address = ?, contact_info = ? WHERE party_id = ?', [name, address, contact_info, id]);
      const affectedRows = result.affectedRows;
      if (affectedRows === 0) {
        return res.status(404).send('Party not found');
      }
      res.json({ message: 'Party updated successfully' });
    } catch (err) {
      console.error('Error updating party:', err);
      res.status(500).send('Error updating party');
    }
  }
  
  async function deleteParty(req, res) {
    try {
      const id = req.params.id;
      const [result] = await db.execute('DELETE FROM party WHERE party_id = ?', [id]);
      const affectedRows = result.affectedRows;
      if (affectedRows === 0) {
        return res.status(404).send('Party not found');
      }
      res.json({ message: 'Party deleted successfully' });
    } catch (err) {
      console.error('Error deleting party:', err);
      res.status(500).send('Error deleting party');
    }
  }

  async function createOrder(req, res) {
    try {
      const { orderName, currencyUomId = "USD", salesChannelEnumId, statusId = "OrderPlaced", productStoreId, placedDate, approvedDate } = req.body;
  
      // Validate required fields
      if (!orderName || !placedDate) {
        return res.status(400).send('Missing required fields');
      }
  
      const [result] = await db.execute('INSERT INTO orders (order_name, currency_uom_id, sales_channel_enum_id, status_id, product_store_id, placed_date, approved_date) VALUES (?, ?, ?, ?, ?, ?, ?)', [orderName, currencyUomId, salesChannelEnumId, statusId, productStoreId, placedDate, approvedDate]);
      res.json({ id: result.insertId });
    } catch (err) {
      console.error('Error creating order:', err);
      res.status(500).send('Error creating order');
    }
  }

  async function addOrderItems(req, res) {
    try {
      const { orderId } = req.params;
      const { partName, facilityId, shipmentMethodEnumId = "ShMthGround", customerPartyId, item_details } = req.body;
  
      // Validate mandatory fields
      if (!customerPartyId || !item_details || !item_details.length) {
        return res.status(400).send('Missing mandatory fields');
      }
  
      // Start a database transaction
      const transaction = await db.beginTransaction();
  
      try {
        // 1. Validate order existence
        const [orderExists] = await db.execute('SELECT 1 FROM orders WHERE order_id = ?', [orderId]);
        if (orderExists.length === 0) {
          throw new Error('Invalid order ID');
        }
  
        // 2. Insert order items
        const itemRows = [];
        for (const item of item_details) {
          const { productId, quantity, unitAmount } = item;
          // Validate mandatory item fields
          if (!productId || !quantity || !unitAmount) {
            throw new Error('Missing mandatory item fields');
          }
          // Check inventory (optional)
          // ...
          itemRows.push([orderId, partName, facilityId, shipmentMethodEnumId, customerPartyId, productId, item.itemDescription, quantity, unitAmount]);
        }
        const [result] = await db.execute('INSERT INTO order_items (order_id, part_name, facility_id, shipment_method_enum_id, customer_party_id, product_id, item_description, quantity, unit_amount) VALUES ?', [itemRows]);
  
        // 3. Update order total amount (optional)
        // ...
  
        // Commit the transaction
        await transaction.commit();
        res.json({ orderId, orderPartSeqId: result.insertId });
      } catch (err) {
        await transaction.rollback();
        console.error('Error adding order items:', err);
        res.status(500).send('Error adding order items');
      }
    } catch (err) {
      console.error('Error processing request:', err);
      res.status(500).send('Internal server error');
    }
  }

  async function getAllOrders(req, res) {
    try {
      const [orders] = await db.execute('SELECT * FROM orders');
      // Enhance with joins for customer and order items
      const enhancedOrders = await Promise.all(orders.map(async (order) => {
        const customerDetails = await db.execute('SELECT * FROM party WHERE party_id = ?', [order.customerPartyId]);
        const orderParts = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [order.orderId]);
        return {
          ...order,
          customer_details: customerDetails[0],
          order_parts: orderParts
        };
      }));
      res.json({ orders: enhancedOrders });
    } catch (err) {
      console.error('Error fetching orders:', err);
      res.status(500).send('Error fetching orders');
    }
  }

  async function updateOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { orderName } = req.body;
  
      // Validate required fields
      if (!orderName) {
        return res.status(400).send('Missing required fields');
      }
  
      const [result] = await db.execute('UPDATE orders SET order_name = ? WHERE order_id = ?', [orderName, orderId]);
      const affectedRows = result.affectedRows;
      if (affectedRows === 0) {
        return res.status(404).send('Order not found');
      }
  
      const [updatedOrder] = await db.execute('SELECT * FROM orders WHERE order_id = ?', [orderId]);
      res.json(updatedOrder[0]);
    } catch (err) {
      console.error('Error updating order:', err);
      res.status(500).send('Error updating order');
    }
  }



module.exports = router;