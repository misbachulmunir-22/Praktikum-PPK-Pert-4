"use client";

import { useState } from "react";


interface Props {
    refresh: () => void;
}


export default function TransactionForm({
    refresh
}: Props) {


    const [form, setForm] = useState({

        title: "",

        amount: "",

        type: "INCOME",

        category: "",

        description: "",

        date: ""

    });



    const [loading, setLoading] = useState(false);



    function handleChange(
        e: React.ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ){

        setForm({

            ...form,

            [e.target.name]:
            e.target.value

        });

    }




    async function handleSubmit(
        e: React.FormEvent
    ){

        e.preventDefault();


        setLoading(true);


        try {


            const response =
            await fetch(
                "/api/transactions",
                {

                    method:"POST",

                    headers:{
                        "Content-Type":
                        "application/json"
                    },


                    body:
                    JSON.stringify(form)

                }
            );



            const data =
            await response.json();



            if(response.ok){


                alert(
                    "Transaksi berhasil ditambahkan"
                );


                setForm({

                    title:"",

                    amount:"",

                    type:"INCOME",

                    category:"",

                    description:"",

                    date:""

                });


                refresh();


            }else{


                alert(
                    data.error ||
                    "Gagal menambahkan transaksi"
                );


            }



        } catch(error){


            console.error(error);


            alert(
                "Terjadi kesalahan"
            );


        } finally {


            setLoading(false);


        }

    }




    return (

        <div>


            <h2>
                Tambah Transaksi
            </h2>



            <form
            onSubmit={handleSubmit}
            >



                <input

                type="text"

                name="title"

                placeholder="Nama transaksi"

                value={form.title}

                onChange={handleChange}

                required

                />




                <input

                type="number"

                name="amount"

                placeholder="Jumlah uang"

                value={form.amount}

                onChange={handleChange}

                required

                />




                <select

                name="type"

                value={form.type}

                onChange={handleChange}

                >

                    <option value="INCOME">
                        Pemasukan
                    </option>


                    <option value="EXPENSE">
                        Pengeluaran
                    </option>


                </select>




                <input

                type="text"

                name="category"

                placeholder="Kategori"

                value={form.category}

                onChange={handleChange}

                />




                <textarea

                name="description"

                placeholder="Deskripsi"

                value={form.description}

                onChange={handleChange}

                />




                <input

                type="date"

                name="date"

                value={form.date}

                onChange={handleChange}

                />




                <button
                type="submit"

                disabled={loading}

                >

                    {
                    loading
                    ?
                    "Menyimpan..."
                    :
                    "Simpan Transaksi"
                    }

                </button>



            </form>


        </div>

    );

}