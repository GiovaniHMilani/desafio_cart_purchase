import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => void;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      const productWithExists = cart.filter(
        (product) => product.id === productId
      )[0];

      if (productWithExists) {
        if (response.data.amount <= productWithExists.amount) {
          return toast.error("Quantidade solicitada fora de estoque");
        }

        updateProductAmount({
          productId: productWithExists.id,
          amount: productWithExists.amount + 1,
        });
      } else {
        const { data } = await api.get(`/products/${productId}`);
        setCart([...cart, { ...data, amount: 1 }]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart, { ...data, amount: 1 }])
        );
      }
    } catch (erro) {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = async (productId: number) => {
    try {
      if (cart.filter((item) => item.id === productId).length) {
        setCart([...cart.filter((item) => item.id !== productId)]);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify([...cart.filter((item) => item.id !== productId)])
        );
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get(`/stock/${productId}`);

      if (amount <= 0) {
        return toast.error("Erro na alteração de quantidade do produto");
      }

      if (response.data.amount < amount) {
        return toast.error("Quantidade solicitada fora de estoque");
      }

      setCart([
        ...cart.map((product) =>
          product.id === productId ? { ...product, amount } : product
        ),
      ]);

      localStorage.setItem(
        "@RocketShoes:cart",
        JSON.stringify([
          ...cart.map((product) =>
            product.id === productId ? { ...product, amount } : product
          ),
        ])
      );
    } catch {
      return toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
