const TemplatesView = () => {
  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Templates</h2>
        <button className="btn-primary">+ Create Template</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="templatesGrid">
        {/* Template cards will be rendered here */}
      </div>
    </div>
  );
};

export default TemplatesView;
