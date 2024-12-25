const Form = ({ children, className, ...rest }) => {
    return (
        <form className={className} action="#" {...rest}>
            {children}
        </form>
    );
}

export default Form;