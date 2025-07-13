import { FC, ReactNode } from "react";

interface Props {
    children: ReactNode;
}
const Layout: FC<Props> = ({ children }) => {
    return (
        <>
            <div className="bg-gypsum overflow-hidden flex flex-col min-h-screen">
                
                    {children}
                

            </div>
        </>
    );
};

export default Layout;
