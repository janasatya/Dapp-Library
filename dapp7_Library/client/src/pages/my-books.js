import Image from "next/image";
import { Allison, Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { ALCHEMY_KEY, Contract_Address } from "../../config";
import { ethers } from "ethers";
import ABI from "../abi/Library.json";
import Web3Modal from "web3modal";


export default function myBooks(){
    const [loading, setLoading] = useState(true);
  const [webApi, setWebApi] = useState({
    contract: null,
    provider: null,
    signer: null,
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchAllBooks();
  }, []);

  const fetchAllBooks = async () => {
    try{
    const web3Modal=new Web3Modal();
        let connection=null;
        try{

            connection=await web3Modal.connect();
        }
        catch(err){
            alert("Please Connect you wallet");

            return;
        }
        const provider=await new ethers.providers.Web3Provider(connection);
        const networkId=await provider.getNetwork();
        // console.log(networkId);
        if(networkId.chainId!=11155111){
            alert("please connect sepolia network");
            return;
        }
        const signer=await provider.getSigner();
    const contract = await new ethers.Contract(Contract_Address, ABI.abi, signer);
    setWebApi({contract,provider,signer})
    const books = await new contract.ownedBooks();
    // console.log(books);
    const allItems = await Promise.all(
      books.map(async (item) => {
        let tokenUri = await contract.tokenURI(item.tokenId);
        // const meta=await axios.get(tokenUri);
        let meta = await fetch(tokenUri);
        meta = await meta.json();
        let price = ethers.utils.formatUnits(item.price.toString(),"ether");
        return {
          bookId: item.bookId.toString(),
          tokenId: item.tokenId.toString(),
          price: price,
          author: meta.author,
          edition: meta.edition,
          image: meta.image,
          name: meta.name,
        };
      })
    );
    // console.log(allItems);
    setItems(allItems);
    setLoading(true);
    setLoading(false);
    }catch(err){
      alert("Please reload the page");
      return;
    }
    //  console.log(allItems);
  };
  const returnBook = async (item) => {
    try{
    const {contract,provider,signer}=webApi;
    const network = await provider.getNetwork();
    if (network.chainId != 11155111) {
      alert("Please connect with sepolia network");
      return;
    }
    const bid = item.bookId;
    const bookPrice = ethers.utils.parseUnits(item.price.toString(),"ether");
    const transaction = await contract.returnBook(bid, item.tokenId);
    transaction.wait();
  }catch(err){
    alert("Please reload the page");
    return;
  }
  };
  if (loading) {
    return (
      <h1 className="text-4xl text-center">
        Please wait for a minute <br /> I am having my lunch........
      </h1>
    );
  }
  if (items.length==0) {
    return (
      <h1 className="text-4xl text-center">
        No Books Available........
      </h1>
    );
  }

  //"https://gateway.pinata.cloud/ipfs/QmUwctQvYoKFk6egYiEYSNW5GjSxSSK9kMcgqLeipGDjWV"


  return (
    <>
      <div className="grid grid-cols-3 gap-4 content-start w-4/6 m-auto ">
        {
          items.map((item,i)=>{
            return (<li key={i} className="list-none">

              <div className="bg-indigo-200 rounded-lg">
          <div className="h-64 block m-auto w-40 bg-indigo-200  ">
            <Image
              alt="#"
              className="rounded mt-4"
              src={item.image}
              width={200}
              height={200}
              />
          </div>
          <div className="">
          <div className="text-xl p-1 px-6 bg-indigo-300 ">BookId: #{item.bookId}</div>
          <div className="text-xl p-1 px-6 bg-indigo-300 ">TokenId: #{item.tokenId}</div>
          <div className="text-xl p-1 px-6 bg-indigo-300 ">Name: {item.name}</div>
          <div className="text-xl p-1 px-6 bg-indigo-300 ">Author: {item.author}</div>
          <div className="text-xl p-1 px-6 bg-indigo-300 ">Edition: {item.edition}</div>
          <div className="text-xl p-1 px-6 bg-indigo-300 ">Price: {item.price} Eth</div>
          </div>
          <button className="text-2xl text-center bg-orange-400 text-white rounded-lg w-full py-3" onClick={()=>{returnBook(item)}}>Return</button>
        </div>
              </li>
            )
          })
        }
      </div>
    </>
  );
}
