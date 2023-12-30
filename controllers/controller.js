async function getParties(req, res) {
    try {
      const [results] = await db.execute('SELECT * FROM party');
      res.json(results);
    } catch (err) {
      console.error('Error fetching parties:', err);
      res.status(500).send('Error fetching parties');
    }
  }