import Search from "../Icons/Search";

const EmptySection = ({ title, desc, ...rest }) => {
    return (
        <div className="p-32 text-center" {...rest}>
            <div className="mx-auto w-[260px] h-[176px]">
                <Search />
            </div>
            <h2 className="text-lg font-semibold text-[#333333] mt-8">{title}</h2>
            <p className="text-[#555555 mt-4 max-w-[486px] mx-auto">{desc}</p>
        </div>
    );
}
export default EmptySection;