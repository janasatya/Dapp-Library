import { useState,useEffect } from 'react';
import {Contract_Address,pinata} from '../../config'
import { ethers } from 'ethers';
import ABI from '../abi/Library.json'
import Web3Modal from 'web3modal'
import Image from 'next/image';
import {useRouter} from 'next/router';
import axios from "axios"
import {data} from './_app'

export default function admin(){
    const router=useRouter();
    const [webApi,setWebApi]=useState({contract:null,signer:null})
    const [flag,setFlag]=useState(true);
    const [image,setImage]=useState(null);
    const [fileUrl,setFileUrl]=useState(null);
    const [formInput,setFormInput]=useState({name:null,author:null,edition:null,price:null});
    const [loading,setLoading]=useState(false)
    const [pageLoading,setPageLoding]=useState(true);
    const [bookId,setBookId]=useState(null);


    useEffect(()=>{
        async function laod(){
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
        const address=await signer.getAddress();
        if(address!="0x5768FF542B059Fa33B75C90ab3d232032a5e64c4"){
            alert("You are not adminisrator");
            router.push('/');
            return;
        }
        const contract =await new ethers.Contract(Contract_Address,ABI.abi,signer);
        setWebApi({contract:contract,signer:signer});
        setPageLoding(false);
        // console.log(data);
    }catch(err){
        alert("Please reload the page");
      return;
    }
        }
        laod();
    },[])

    const uploadImage=async(e)=>{
        //if(image==null)return;
        console.log("fuck")
        try{
            let img=e.target.files[0];
            const formData = new FormData();
            formData.append("file",img);
            const resFile = await axios({
                method: "post",
                url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
                data: formData,
                headers:{
                    'pinata_api_key':pinata.APIKey,
                    'pinata_secret_api_key':pinata.APISecret,
                    'Content-Type':'multipart/form-data'
                },
            });

            const ImageURL = `https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
            //console.log(ImageURL);
            setFileUrl(ImageURL);
        }
        catch(err){
            console.log("error to upload",err)
        }
    }
    async function uploadMetadata(){
        const {name,author,edition,price}=formInput;
        if(!name || !author || !edition || !price)return;
        // console.log("file",fileUrl);
        try{
             //await uploadImage();
            const metadata=JSON.stringify({
                    "description":"NA",
                    "image":await fileUrl,
                    "name":name,
                    "author":author,
                    "edition":edition,
                    "price":price
            });
            const resFile=await axios({
                    method: "post",
                    url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
                    data: metadata,
                    headers:{
                        'pinata_api_key':pinata.APIKey,
                        'pinata_secret_api_key':pinata.APISecret,
                        'Content-Type':'application/json'
                    },
            })
            const tokenUri=`https://gateway.pinata.cloud/ipfs/${resFile.data.IpfsHash}`;
            // console.log("tokenUrl",tokenUri);
            return tokenUri;
        }
        catch(err){
            console.log("metadata upload fail",err)
        }
    }

    async function addNewBook(){
        try{
        const {name,author,edition,price}=formInput;
        // console.log(name,"+",author,"+",edition,"+",price)
        if(!name || !author || !edition || !price)return;
        setLoading(true)
         const tokenUri=await uploadMetadata();
        //  console.log(tokenUri);
        const contract=webApi.contract;
        const bookPice=await ethers.utils.parseUnits(price,'ether');
        // console.log(bookPice);
         const transaction=await contract.mintNewBook(tokenUri,bookPice);
         transaction.wait();
        setLoading(false);
        }catch(err){
            alert("Please reload the page");
      return;
        }
    }

    async function addOldBook(){
        //console.log(bookId);
        try{
        const {contract}=webApi;
        const transaction=await contract.mintOldBook(bookId);
        transaction.wait();
        }catch(err){
            alert("Please reload the page");
      return;
        }
    }


    if(pageLoading){
        return (
            <h1 className='text-4xl text-center'>Please wait for a minute <br /> I am doing my lunch........</h1>
        )
    }



    return (
        <>
        <div className='flex justify-center gap-4'>
            
                <button className='bg-orange-600 px-20 py-2 my-4 rounded-t-lg text-white'onClick={()=>{setFlag(true)}}>Add New Book</button>
                <button className='bg-orange-600 px-20 py-2 my-4 rounded-t-lg text-white ' onClick={()=>{setFlag(false)}}>Add Old Book</button>
            </div>
            {
                flag && <>
                <div className='flex justify-center'>
                <div className='w-1/8 flex-col mr-12 mt-10'>
                    {
                        !fileUrl && <Image alt="#" className="rounded mt-4" src='/blur.jpg' width={200} height={200}/>
                    }
                    {
                        fileUrl && <Image src={fileUrl} alt="Image uploaded successfully" width={300} height={200} placeholder="blur" blurDataURL='/blur.jpg'/>
                    }
                </div>
                <div className='container max-w-md'>
                    <div className='p-2 '>
                    <label htmlFor="name" className='text-xl'>Name: </label>
                    <input type="text" name="name" id="name" className='bg-slate-200 border-2 border-slate-600 px-2 py-1 rounded-xl' onChange={(e)=>{
                        setFormInput({...formInput,name:e.target.value})
                    }}/>
                    </div>
                    <div className='p-2 '>
                    <label htmlFor="author"className='text-xl'>Author: </label>
                    <input type="text" name="author" id="author" className='bg-slate-200 border-2 border-slate-600 px-2 py-1 rounded-xl'onChange={e=>{setFormInput({...formInput,author:e.target.value})}}/>
                    </div>
                    <div className='p-2 '>
                    <label htmlFor="edition"className='text-xl'>Edition: </label>
                    <input type="text" name="edition" id="edition"className='bg-slate-200 border-2 border-slate-600 px-2 py-1 rounded-xl' onChange={(e)=>{setFormInput({...formInput,edition:e.target.value})}}/>
                    </div>
                    <div className='p-2 '>
                    <label htmlFor="price"className='text-xl'>Price: </label>
                    <input type="number" name="price" id="price" className='bg-slate-200 border-2 border-slate-600 px-2 py-1 rounded-xl'onChange={(e)=>{setFormInput({...formInput,price:e.target.value})}}/>
                    </div>
                    <br />
                    <div className='p-2 '>
                    <label htmlFor="image"className='text-xl'>Image: </label>
                    <input type="file" name="image" id="image" onChange={(e)=>{
                        setImage(e.target.files[0])
                        uploadImage(e);
                    }}/>
                    </div>
                    {
                        !loading &&<button type="submit" className='bg-orange-600 px-20 py-2 my-4 rounded-xl text-white ' onClick={addNewBook}>Upload</button>
                    }
                    {
                        loading && <button type="submit" className='bg-orange-600 px-20 py-2 my-4 rounded-xl text-white '>Wait for Upload...</button>
                    }
                    
                </div>
                </div>
                </>
            }
            {
                !flag && <>
                <div className='flex justify-center'>
                <div className='container max-w-md'>
                    <div className='p-2 '>
                    <label htmlFor="price"className='text-xl'>Book Id: </label>
                    <input type="number" name="price" id="price" className='bg-slate-200 border-2 border-slate-600 px-2 py-1 rounded-xl' onChange={(e)=>{setBookId(e.target.value)}}/>
                    </div>
                    <br />
                    <button type="submit" className='bg-orange-600 px-20 py-2 my-4 rounded-xl text-white ' onClick={addOldBook}>Submit</button>
                </div>
                </div>
                </>
            }
        </>
    )
}