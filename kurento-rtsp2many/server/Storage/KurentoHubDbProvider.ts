import Db = require('./KurentoHubDb');

export = {
	get : () => {
		return new Promise((resolve, reject) => {
			Db.connect()
			  .then(() => {
				  resolve(Db)
			  }, (err) => {
				  reject(err)
			  });
		})
	}
}