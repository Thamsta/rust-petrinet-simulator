#[cfg(test)]
mod tests {
    use crate::common::RGResponse;
    use crate::model_checking::check_properties;
    use crate::model_checking::mod_test::ExpectedRGResponse;

    #[test]
    fn single_firing() {
        // Simple net (1)-->[ ]
        let result = check_properties(vec![1], vec![vec![1]], vec![vec![0]]);

        let expected = ExpectedRGResponse {
            states: 2,
            edges: 1,
            reversible: false,
            liveness: false,
            bounded: 1,
            bounded_vec: vec![1],
        };

        assert_result(result, expected);
    }

    #[test]
    fn unbounded() {
        // Unbounded net [ ]-->(1)
        let result = check_properties(vec![1], vec![vec![0]], vec![vec![1]]);

        let expected = ExpectedRGResponse {
            states: 0,
            edges: 0,
            reversible: false,
            liveness: false,
            bounded: -1,
            bounded_vec: vec![],
        };

        assert_result(result, expected);
    }

    #[test]
    fn circle() {
        // Circle   ┌-->[ ]->(1)
        //         (0)<-[ ]<--┘
        let result = check_properties(
            vec![0,1],
            vec![vec![0, 1], vec![1, 0]],
            vec![vec![1, 0], vec![0, 1]]
        );

        let expected = ExpectedRGResponse {
            states: 2,
            edges: 2,
            reversible: true,
            liveness: true,
            bounded: 1,
            bounded_vec: vec![1, 1],
        };

        assert_result(result, expected);
    }

    #[test]
    fn circle_larger_marking() {
        // Circle   ┌-->[ ]->(9)
        //         (9)<-[ ]<--┘
        let result = check_properties(
            vec![9,9],
            vec![vec![0, 1], vec![1, 0]],
            vec![vec![1, 0], vec![0, 1]]
        );

        let expected = ExpectedRGResponse {
            states: 19,
            edges: 36,
            reversible: true,
            liveness: true,
            bounded: 18,
            bounded_vec: vec![18, 18],
        };

        assert_result(result, expected);
    }

    #[test]
    fn circle_with_sink() {
        // Circle   ┌-->[ ]->(1)-->[ ]-->(0)
        //         (0)<-[ ]<--┘
        let result = check_properties(
            vec![0, 1, 0],
            vec![vec![0, 1, 0], vec![1, 0, 0], vec![0, 1, 0]],
            vec![vec![1, 0, 0], vec![0, 1, 0], vec![0, 0, 1]]
        );

        let expected = ExpectedRGResponse {
            states: 3,
            edges: 3,
            reversible: false,
            liveness: false,
            bounded: 1,
            bounded_vec: vec![1, 1, 1],
        };

        assert_result(result, expected);
    }

    #[test]
    fn bounded_live() {
        // numeration from top to bottom, left to right
        //
        //       ┌─────────█t1█<───────┐
        //       V┌───────────────┐    │
        //  ┌──>(0)─>█t2█<─(1)<──┐V    │
        // █t3█       ││        █t4█─>(0)
        //  └<──(1)<──┘└──>(0)───>┘

        let result = check_properties(
            vec![0, 1, 0, 1, 0],
            vec![vec![0, 0, 1, 0, 0], vec![1, 1, 0, 0, 0], vec![0, 0, 0, 1, 0], vec![1, 0, 0, 0, 1]],
            vec![vec![1, 0, 0, 0, 0], vec![0, 0, 0, 1, 1], vec![1, 0, 0, 0, 0], vec![0, 1, 1, 0, 0]]
        );

        let expected = ExpectedRGResponse {
            states: 5,
            edges: 5,
            reversible: false,
            liveness: true,
            bounded: 1,
            bounded_vec: vec![1, 1, 1, 1, 1],
        };

        assert_result(result, expected);
    }

    #[test]
    fn bounded_reversible() {
        // Circle   ┌-->[ ]->(1)   [ ]<--(0)
        //         (0)<-[ ]<--┘

        let result = check_properties(
            vec![0, 1, 0],
            vec![vec![0, 1, 0], vec![1, 0, 0], vec![0, 0, 1]],
            vec![vec![1, 0, 0], vec![0, 1, 0], vec![0, 0, 0]]
        );

        let expected = ExpectedRGResponse {
            states: 2,
            edges: 2,
            reversible: true,
            liveness: false,
            bounded: 1,
            bounded_vec: vec![1, 1, 0],
        };

        assert_result(result, expected);
    }

    fn assert_result(result: Result<RGResponse, String>, expected: ExpectedRGResponse) {
        match result {
            Ok(rg) => {
                assert_eq!(rg.states, expected.states);
                assert_eq!(rg.edges, expected.edges);
                assert_eq!(rg.bounded, expected.bounded);
                assert_eq!(rg.bounded_vec, expected.bounded_vec);
                assert_eq!(rg.reversible, expected.reversible);
                assert_eq!(rg.liveness, expected.liveness);
            }
            Err(msg) => {
                panic!("Failed: {}", msg)
            }
        }
    }
}

struct ExpectedRGResponse {
    pub states: usize,
    pub edges: usize,
    pub reversible: bool,
    pub liveness: bool,
    pub bounded: i16,
    pub bounded_vec: Vec<i16>,
}
