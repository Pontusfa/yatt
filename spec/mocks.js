var mocks = {};

mocks.app = {
    get: function(){},
    post: function(){},
    config: {
        site:{
            private: false,
            ranks:{
                MEMBER: 2,
                PUBLIC : 1
            }
        }
    }
};

mocks.jadeCompiler = function(){};

mocks.queries = {
    countCollection: function(model, criteria, callback){
    },
    getDocuments: function(criteria, model, sortBy, offsetlimit, wantedFields, callback){
    }
};

module.exports = mocks;
