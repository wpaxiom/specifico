const Checkbox = ({ className, text, ...rest }) => {
    return (
        <div className="specifico-form-control">
            <div className="specifico-content__checkbox">
                <label className={className}>
                    <input type="checkbox" {...rest} /> <span>{text}</span>
                </label>
            </div>
        </div>
    );
}
export default Checkbox;