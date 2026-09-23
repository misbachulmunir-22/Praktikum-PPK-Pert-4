"use client";

import TransactionForm from "@/components/TransactionForm";
import { useEffect, useState } from "react";


export default function TransactionsPage(){

    const [transactions,setTransactions] = useState([]);

    const [filter,setFilter] = useState("ALL");


    async function getTransactions(){

        let url="/api/transactions";


        if(filter !== "ALL"){
            url += `?type=${filter}`;
        }


        const res = await fetch(url);

        const data = await res.json();


        setTransactions(data.transactions || []);

    }



    async function deleteTransaction(id:number){

        const confirmDelete = confirm(
            "Apakah yakin ingin menghapus transaksi ini?"
        );


        if(!confirmDelete) return;


        await fetch(
            "/api/transactions",
            {
                method:"DELETE",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    id
                })
            }
        );


        getTransactions();

    }



    async function editTransaction(item:any){

        const newTitle = prompt(
            "Ubah judul transaksi:",
            item.title
        );


        if(!newTitle) return;


        await fetch(
            "/api/transactions",
            {
                method:"PUT",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    id:item.id,

                    title:newTitle,

                    amount:item.amount,

                    type:item.type,

                    category:item.category,

                    description:item.description,

                    date:item.date

                })
            }
        );


        getTransactions();

    }



    useEffect(()=>{

        getTransactions();

    },[filter]);



    return(

        <div>


            <h1>
                Manajemen Transaksi
            </h1>


            <TransactionForm
                refresh={getTransactions}
            />



            <h3>
                Filter Transaksi
            </h3>


            <select

            value={filter}

            onChange={(e)=>setFilter(e.target.value)}

            >

                <option value="ALL">
                    Semua
                </option>


                <option value="INCOME">
                    Pemasukan
                </option>


                <option value="EXPENSE">
                    Pengeluaran
                </option>


            </select>



            <hr/>



            {
            transactions.map((item:any)=>(

                <div key={item.id}>


                    <p>
                    Judul: {item.title}
                    </p>


                    <p>
                    Jumlah: Rp {item.amount}
                    </p>


                    <p>
                    Jenis: {item.type}
                    </p>


                    <p>
                    Kategori: {item.category}
                    </p>



                    <button
                    onClick={() => editTransaction(item)}
                    >
                    Edit
                    </button>



                    <button
                    onClick={() => deleteTransaction(item.id)}
                    >
                    Hapus
                    </button>


                    <hr/>


                </div>

            ))
            }


        </div>

    )

}