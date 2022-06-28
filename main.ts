import * as CoinbasePro from 'coinbase-pro';
import axios from 'axios';
import { config } from 'dotenv';

config();

if (!process.env.PASSPHRASE) {
  throw new Error('Missing process.env.PASSPHRASE');
}

if (!process.env.SECRET) {
  throw new Error('Missing process.env.SECRET');
}

if (!process.env.API_KEY) {
  throw new Error('Missing process.env.API_KEY');
}

const key = process.env.API_KEY;
const passphrase = process.env.PASSPHRASE;
const secret = process.env.SECRET;
const slackUrl = process.env.SLACK_WEBHOOK_URL;
const apiURI = 'https://api.pro.coinbase.com';

type SupportedProducts = 'BTC-EUR' | 'ETH-EUR';

const purchase = async (crypto: SupportedProducts, amount: number) => {
  const client = new CoinbasePro.AuthenticatedClient(
    key,
    secret,
    passphrase,
    apiURI
  );

  const order: any = {
    side: 'buy',
    funds: amount,
    product_id: crypto,
    type: 'market',
  };

  console.log(order);

  try {
    const response = await client.placeOrder(order);

    console.log(response);
    await postMessageToSlack(
      `✅ ✅ ✅ ✅ ✅  Purchased ${crypto} for ${amount}`,
      response
    );
  } catch (e) {
    console.error(e);
    await postMessageToSlack(
      `❌ ❌ ❌ ❌ ❌ Failed buying crypto for ${amount}`,
      e
    );
  }
};

const postMessageToSlack = (text: string, markdown: any) => {
  if (!slackUrl) {
    return;
  }

  const body = {
    text,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: text,
        },
      },
    ],
  };

  if (markdown) {
    body.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '```' + JSON.stringify(markdown) + '```',
      },
    });
  }

  return axios
    .post(slackUrl, JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((response) => {
      console.log('SUCCEEDED: Sent slack webhook: \n', response.data);
    })
    .catch((error) => {
      console.log('FAILED: Send slack webhook', error.message);
    });
};

export const run = async () => {
  const orders: {
    crypto: SupportedProducts;
    amount: number;
  }[] = [
    {
      crypto: 'ETH-EUR',
      amount: 2.5,
    },
    {
      crypto: 'BTC-EUR',
      amount: 1.5,
    },
  ];

  await Promise.all(
    orders.map((order) => purchase(order.crypto, order.amount))
  );
};
