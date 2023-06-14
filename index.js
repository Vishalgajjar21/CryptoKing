const Moralis = require("moralis").default;
const express = require("express");
const app = express();
const cors = require("cors");
const port = 8080;

require("dotenv").config();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Working!");
});

app.listen(port, () => {
  console.log(`CryptoKing app is listening on port ${port}`);
});

Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
}); 
// -----------------------GET NATIVE BALANCE OF USER ENDPOINT-----------------------------
 
const native_Balance = () => {
  app.get("/nativeBalance", async (req, res) => {
    try {
      const { address, chain } = req.query;
      const response = await Moralis.EvmApi.balance.getNativeBalance({
        address: address,
        chain: chain,
      });

      const nativeBalance = response.raw;

      // GET TOKEN PRICE OF ERC20 TOKEN WITH THE WETH AND WMATIC
      let nativeCurrency;

      if (chain === "0x1") {
        // Wrapped ETHEREUM Address (WETH)
        nativeCurrency = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
      } else if (chain === "0x89") {
        // Wrapped MATIC Address   (WMATIC)
        nativeCurrency = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270";
        // Binance address (BNB)
      } else if (chain === "0x38") {
        nativeCurrency = "0x3a0d9d7764FAE860A659eb96A500F1323b411e68";
        // nativeCurrency = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
      }

      //  ------------------GET TOKEN PRICE ENDPOINT--------------------
      try {
        const nativePrice = await Moralis.EvmApi.token.getTokenPrice({
          address: nativeCurrency,
          chain: chain,
        });
        // nativeBalance.usd = nativePrice.data.usdPrice;
        nativeBalance.usd = nativePrice.raw.usdPrice;
        // console.log("THIS IS RESPONSE raw:");
      } catch (error) {
        console.error(error);
      }

      res.send(nativeBalance);
      console.log(response.toJSON());
      console.log("Native Balances is Running To FETCH BALANCE");
    } catch (e) {
      res.send(e);
    }
  });
};
// native_Balance();

// -----------------------DISPLAY USER'S TOKENS AND FILTERING TOKENS-----------------------------
const token_Balances = () => {
  app.get("/tokenBalances", async (req, res) => {
    // try {
      const { address, chain } = req.query;
      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        address: address, 
        chain: chain,
      }); 
      // res.send(response);
      // 
      // console.log(response);
    // console.log(response.raw);
    // res.send(response);
    // -----------------------GET PRICE WITH COINCAP API----------------------------
    // let tokens = response.raw
      // for (let i =0; i < tokens.length; i ++ ){
        
        
      // const token_price = async () => {
      //       const options = {method: "GET",url: "https://api.coingecko.com/api/v3/simple/price",
      //           params: {
      //           ids: "ethereum",
      //           vs_currencies: "usd",
      //         },
      //       };
      //       console.log(options)
          
      //       try {
      //         const response = await axios.request(options);
      //         console.log(response.data);
      //       } catch (error) {
      //         console.error(error);
      //       }
      //     };
      //     token_price()
       
      
      // ---------------FILTER SCAM TOKENS-----------------
       
      let tokens = response.raw;
      let legitTokens = [];
      
      // // starting the loop to get all tokens-------------------
      for (let i = 0; i < tokens.length; i++) {
      const priceResponse = await Moralis.EvmApi.token.getTokenPrice({
        address: tokens[i].token_address,
        chain: chain,
      });

      // -------------------coingecco price response which is working on single chain returing price of 1 eth in usd-----------
      // const address = "0xC02aaa39b223FE8D0A0e5C4F27eAD9083C756Cc2";
      // const priceResponse = {method: "GET",url: "https://api.coingecko.com/api/v3/simple/price",
      //           params: {
      //           ids: "ethereum",
      //           address : tokens[i].token_address,
      //           vs_currencies: "usd",
      //         },
      //       };

      // console.log("THIS IS  RESPONSES-------------------------",priceResponse);
      // res.send(priceResponse);
      console.log(priceResponse.toJSON());
    // }
      // console.log(priceResponse);

    //   // condition to fetch scam coin----- REAL--------------------------------
      if (priceResponse.raw.usdPrice > 0.01) {
          tokens[i].usd = priceResponse.raw.usdPrice;
          legitTokens.push(tokens[i]);
        } else {
        console.log("💩 Coin");
      } 
    }

    //-------------to convert json stringify becasue of error circular json ------------------
    // try {
    //   const jsonData = JSON.stringify(legitTokens);
    //   res.send(jsonData);
    // } catch (error) {
      //   console.error("Circular structure error:", error);
      //   res.status(500).send("An error occurred.");
      // }    
      // ---------------------------res.send----------------------------------------------
      res.send(legitTokens);
      // res.send(response); 
      console.log("Token Balances is Running to GET TOKENS");
      // } catch (e) {
        //   console.error(e); 
        // res.send(e);
        // }
      }); 
}; 
// token_Balances();

// --------------------------------FETCH ERC 20 TOKEN TRANSFERS-------------------------------------

const token_transfers = () => {
  app.get("/tokenTransfers", async (req, res) => {
    try {
      const { address, chain } = req.query;
      const response = await Moralis.EvmApi.token.getWalletTokenTransfers({
        chain: chain,
        address: address,
      });

      const userTrans = response.raw.result;

      let userTransDetails = [];

      for (let i = 0; i < userTrans.length; i++) {
        try {
          const metaResponse = await Moralis.EvmApi.token.getTokenMetadata({
            addresses: [userTrans[i].address],
            chain: chain,
          });
          if (metaResponse.raw) {
            userTrans[i].decimals = metaResponse.raw[0].decimals;
            userTrans[i].symbol = metaResponse.raw[0].symbol;
            userTransDetails.push(userTrans[i]);
          } else {
            console.log("no details for coin");
          }
        } catch (e) {
          console.log(e);
        }
      }

      res.send(userTransDetails);
      console.log("Token Transfer is Running to Fetch TRANSFER HISTORY");
    } catch (e) {
      console.error(e);
      res.send(e);
    }
  });
};
// token_transfers();

// --------------------------------Get wallet NFT-------------------------------------

const nft_Balance = () => {
  app.get("/nftBalance", async (req, res) => {
    try {
      const { address, chain } = req.query;
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        chain: chain,
        address: address,
      });

      res.send(response.raw);
      console.log("NFT balance is Running to FETCH NFT");
    } catch (e) {
      // res.send(e);
      console.error(e);
    }
  });
};
// nft_Balance();

const apilimit = async () => {
  const response = await Moralis.EvmApi.utils.endpointWeights();
  console.log(response?.toJSON());
};

// const token_price = async()=>{

  
//   const apiUrl = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2&vs_currencies=usd';
  
//     try {
//       const response = await axios.get(apiUrl);
//       const tokenPrice = response.data['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'].usd;
//       console.log(`Token Price: $${tokenPrice}`);
//     } catch (error) {
//       console.error('Error fetching token price:', error);
//     }
//   }
//   // token_price();


function test() {
  native_Balance();
  token_Balances();
  token_transfers();
  nft_Balance();
  //  apilimit()
  console.log("");
}
test();

// const token_price = async () => {
//   const options = {
//     method: "GET",
//     url: "https://coingecko.p.rapidapi.com/simple/price",
//     params: {
//       ids: "Ethereum",
//       vs_currencies: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
//     },
//     headers: {
//       "X-RapidAPI-Key": "ef3a5f69a9msh2c22a97a0a1cb05p1b8f7fjsn5b5b89cda47d",
//       "X-RapidAPI-Host": "coingecko.p.rapidapi.com",
//     },
//   };

//   try {
//     const response = await axios.request(options);
//     console.log(response.data);
//   } catch (error) {
//     console.error(error);
//   }
// }; 
// token_price()

