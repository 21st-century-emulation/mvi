import express, { json } from 'express';
import got from 'got';
import CacheableLookup from 'cacheable-lookup';

const app = express();
const port = 8080;
const { WRITE_MEMORY_API } = process.env;

app.use(json());

app.get('/status', (req, res) => {
  res.send("Healthy");
});

app.post('/api/v1/execute', async (req, res) => {
  if (req.body.opcode === undefined) {
    console.log(`Invalid request body ${JSON.stringify(req.body)}`);
    res.sendStatus(400);
    return;
  }

  if (req.query.operand1 === undefined) {
    console.log('MVI operation requires operand');
    res.sendStatus(400);
    return;
  }

  if (req.body.opcode === 0x36) { // MVI (HL), d8
    await got.post(WRITE_MEMORY_API, {json: {}, searchParams: {
      // eslint-disable-next-line no-bitwise
      address: (req.body.state.h << 8) | req.body.state.l,
      id: req.body.id,
      value: req.query.operand1
    }});
    
    req.body.state.cycles += 10;
    res.send(req.body);
  } else {
    switch (req.body.opcode) {
      case 0x06: // MVI B, d8
        req.body.state.b = parseInt(req.query.operand1, 10);
        break;
      case 0x0E: // MVI C, d8
        req.body.state.c = parseInt(req.query.operand1, 10);
        break;
      case 0x16: // MVI D, d8
        req.body.state.d = parseInt(req.query.operand1, 10);
        break;
      case 0x1E: // MVI E, d8
        req.body.state.e = parseInt(req.query.operand1, 10);
        break;
      case 0x26: // MVI H, d8
        req.body.state.h = parseInt(req.query.operand1, 10);
        break;
      case 0x2E: // MVI L, d8
        req.body.state.l = parseInt(req.query.operand1, 10);
        break;
      case 0x3E: // MVI A, d8
        req.body.state.a = parseInt(req.query.operand1, 10);
        break;
      default:
        console.log(`Invalid opcode sent to MVI instruction ${req.body.opcode}`);
        break;
    }
    req.body.state.cycles += 7;
    res.send(req.body);
  }
});

app.listen(port, () => {
  console.log(`MVI listening at http://0.0.0.0:${port}`);
});
