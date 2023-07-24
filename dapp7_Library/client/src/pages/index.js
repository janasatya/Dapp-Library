import Image from "next/image";
import { Allison, Inter } from "next/font/google";
import { useState, useEffect } from "react";
import { ALCHEMY_KEY, Contract_Address } from "../../config";
import { ethers } from "ethers";
import ABI from "../abi/Library.json";
import Web3Modal from "web3modal";
// import axios from 'axios';
// import Image from 'next/image';
import { useRouter } from "next/router";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [webApi, setWebApi] = useState({
    contract: null,
    provider: null,
    signer: null,
  });
  const [items, setItems] = useState(null);
  const [allBooks,setAllBooks]=useState(null);
  const [noBook,setNoBook]=useState(false);
  
  const router = useRouter();
  let data = router.query.search;
  useEffect(() => {
    fetchAllBooks();
  }, []);
  useEffect(() => {
    // console.log(data);
    if (items != null && (data!="" && data!=undefined && data!=null)) {
      let book=null;
      data=data.toLowerCase();
      for(let i=0;i<items.length;i++){

      const bookId = items[i].bookId;
      const author = items[i].author;
      const name = items[i].name;
      if(bookId.length==data.length && bookId==data)
      {
        console.log(bookId);
        book=items[i];break;
      }
      if(author.length>=data.length){
        let nauthor=author.toLowerCase();
        nauthor=nauthor.substr(0,data.length);
        if(data==nauthor){
          book=items[i];
          console.log(author);
          break;
        }
      }else{
        let nauthor=author.toLowerCase();
        let ndata=data.substr(0,author.length);
        if(ndata==nauthor){
          console.log(author);
          book=items[i];
          break;
        }
      }
      if(name.length>=data.length){
        let nname=name.toLowerCase();
        nname=nname.substr(0,data.length);
        if(data==nname){
          console.log(name);
          book=items[i];
          break;
        }
      }else{
        let nname=name.toLowerCase();
        let ndata=data.substr(0,name.length);
        if(ndata==nname){
          book=items[i];
          console.log(name);
          break;
        }
      }
      }
      if(book==null){
        setNoBook(true)
        setAllBooks(items);
      }else{
        let books=[];
        books.push(book);
        setAllBooks(books);
        setNoBook(false);
      }
    }
    else{
      setNoBook(false);
      setAllBooks(items);
    }
  }, [data]);

  const fetchAllBooks = async () => {
    try{
    const provider = await new ethers.providers.JsonRpcProvider(ALCHEMY_KEY);
    const abi = ABI.abi;
    const contract = await new ethers.Contract(Contract_Address, abi, provider);
    const books = await new contract.fetchBooks();
    const allItems = await Promise.all(
      books.map(async (item) => {
        let tokenUri = await contract.tokenURI(item.tokenId);
        let count = await contract.noOfBooks(item.bookId);
        count = count.toString();
        let meta = await fetch(tokenUri);
        meta = await meta.json();
        let price = ethers.utils.formatUnits(item.price.toString(), "ether");
        return {
          bookId: item.bookId.toString(),
          tokenId: item.tokenId.toString(),
          price: price,
          author: meta.author,
          edition: meta.edition,
          image: meta.image,
          name: meta.name,
          remain: count,
        };
      })
    );
    // console.log(allItems);
    setItems(allItems);
    setAllBooks(allItems);
    setLoading(true);
    setLoading(false);
    }catch(err){
      alert("Please reload the page");
      return;
    }
    //  console.log(allItems);
  };
  const borrowBook = async (item) => {
    try{
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();

    const provider = await new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    const network = await provider.getNetwork();
    if (network.chainId != 11155111) {
      alert("Please connect with sepolia network");
      return;
    }
    const contract = await new ethers.Contract(
      Contract_Address,
      ABI.abi,
      signer
    );
    const bid = item.bookId;
    const price = item.price;
    const bookPrice = ethers.utils.parseUnits(item.price.toString(), "ether");
    try {
      const transaction = await contract.borrowBooks(bid, { value: bookPrice });
      transaction.wait();
    } catch (err) {
      alert("Sorry you can't purchase");
      return;
    }
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
  if (noBook) {
    return (
      <h1 className="text-4xl text-center">
        No books Available........
      </h1>
    );
  }

  //"https://gateway.pinata.cloud/ipfs/QmUwctQvYoKFk6egYiEYSNW5GjSxSSK9kMcgqLeipGDjWV"

  return (
    <>
      <div className="grid grid-cols-4 gap-4 content-start w-4/6 m-auto ">
        {allBooks.map((item, i) => {
          return (
            <li key={i} className="list-none">
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
                <div className="h-60 bg-indigo-300">
                  <div className="text-xl p-1 px-6 bg-indigo-300 ">
                    BookId: #{item.bookId}
                  </div>
                  <div className="text-xl p-1 px-6 bg-indigo-300 ">
                    Name: {item.name}
                  </div>
                  <div className="text-xl p-1 px-6 bg-indigo-300 ">
                    Author: {item.author}
                  </div>
                  <div className="text-xl p-1 px-6 bg-indigo-300 ">
                    Edition: {item.edition}
                  </div>
                  <div className="text-xl p-1 px-6 bg-indigo-300 ">
                    Available: {item.remain}
                  </div>
                  <div className="text-xl p-1 px-6 bg-indigo-300 ">
                    Price: {item.price} Eth
                  </div>
                </div>
                <button
                  className="text-2xl text-center bg-orange-400 text-white rounded-lg w-full py-3"
                  onClick={() => {
                    borrowBook(item);
                  }}
                >
                  Borrow
                </button>
              </div>
            </li>
          );
        })}
      </div>
    </>
  );
}
